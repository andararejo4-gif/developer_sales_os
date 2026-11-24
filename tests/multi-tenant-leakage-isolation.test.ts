import { describe, expect, it } from 'bun:test';
import {
  filterByTenant,
  verifyTenantOwnership,
  TenantAccessError,
  UserSessionContext,
  BusinessEntity,
} from '../src/lib/db/tenant-guard';

interface DummyLead extends BusinessEntity {
  fullName: string;
  phoneWa: string;
  ownerSeEmail: string;
  ownerSeName: string;
  stage: string;
  isInPool: boolean;
  poolReason?: string;
}

interface DummyBankAccount extends BusinessEntity {
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  isPrimary: boolean;
}

interface DummyAuditLog extends BusinessEntity {
  actorEmail: string;
  actorRole: string;
  action: string;
  targetEntity: string;
  summary: string;
}

interface DummyAicWallet extends BusinessEntity {
  balanceAic: number;
  planCode: string;
}

describe('MULTI-TENANT LEAKAGE & ISOLATION STRESS TEST (100 Users & 100 Dummy Data)', () => {
  const TENANT_A = 'andara_rejo_makmur';
  const TENANT_B = 'sinar_mas_land_serpong'; // Tenant Baru untuk pengujian isolasi

  // 1. Generate 100 Pengguna Tenant B (Tenant Baru) + 100 Pengguna Tenant A
  const roles = ['SE', 'TL', 'SM', 'ADMIN', 'DIREKSI'] as const;

  const usersTenantA: UserSessionContext[] = Array.from({ length: 100 }, (_, i) => {
    const num = String(i + 1).padStart(3, '0');
    const role = roles[i % roles.length];
    return {
      userId: `user-andara-${num}`,
      tenantId: TENANT_A,
      role,
      email: `se_andara_${num}@andara.co.id`,
      name: `SE Andara ${num}`,
    };
  });

  const usersTenantB: UserSessionContext[] = Array.from({ length: 100 }, (_, i) => {
    const num = String(i + 1).padStart(3, '0');
    const role = roles[i % roles.length];
    return {
      userId: `user-sinarmas-${num}`,
      tenantId: TENANT_B,
      role,
      email: `se_sinarmas_${num}@sinarmasland.com`,
      name: `SE SinarMas ${num}`,
    };
  });

  // 2. Generate 100 Data Dummy Leads per Tenant (Total 200 Leads)
  // Termasuk lead biasa dan lead yang dilepas ke Lead Pool
  const leadsTenantA: DummyLead[] = Array.from({ length: 100 }, (_, i) => {
    const num = String(i + 1).padStart(3, '0');
    const isInPool = i % 5 === 0; // 20 lead berada di pool
    return {
      id: `lead-andara-${num}`,
      tenant_id: TENANT_A,
      fullName: `Prospek Andara ${num}`,
      phoneWa: `+628111111${num}`,
      ownerSeEmail: `se_andara_${String((i % 10) + 1).padStart(3, '0')}@andara.co.id`,
      ownerSeName: `SE Andara ${String((i % 10) + 1).padStart(3, '0')}`,
      stage: isInPool ? 'WARM_DISCUSSION' : 'VISITED',
      isInPool,
      poolReason: isInPool ? 'Tidak ada respons > 24 jam' : '',
    };
  });

  const leadsTenantB: DummyLead[] = Array.from({ length: 100 }, (_, i) => {
    const num = String(i + 1).padStart(3, '0');
    const isInPool = i % 4 === 0; // 25 lead berada di pool
    return {
      id: `lead-sinarmas-${num}`,
      tenant_id: TENANT_B,
      fullName: `Prospek BSD City ${num}`,
      phoneWa: `+628222222${num}`,
      ownerSeEmail: `se_sinarmas_${String((i % 10) + 1).padStart(3, '0')}@sinarmasland.com`,
      ownerSeName: `SE SinarMas ${String((i % 10) + 1).padStart(3, '0')}`,
      stage: isInPool ? 'WARM_DISCUSSION' : 'HOT_NEGOTIATION',
      isInPool,
      poolReason: isInPool ? 'Lead Baru Siap Diambil Alih' : '',
    };
  });

  // 3. Generate 100 Data Dummy Rekening Bank per Tenant
  const bankAccountsTenantA: DummyBankAccount[] = Array.from({ length: 100 }, (_, i) => {
    const num = String(i + 1).padStart(3, '0');
    return {
      id: `bank-andara-${num}`,
      tenant_id: TENANT_A,
      bankName: i % 2 === 0 ? 'BCA Escrow Andara' : 'Mandiri Operasional Andara',
      accountNumber: `777-001-${num}`,
      accountHolder: 'PT Andara Rejo Makmur',
      isPrimary: i === 0,
    };
  });

  const bankAccountsTenantB: DummyBankAccount[] = Array.from({ length: 100 }, (_, i) => {
    const num = String(i + 1).padStart(3, '0');
    return {
      id: `bank-sinarmas-${num}`,
      tenant_id: TENANT_B,
      bankName: i % 2 === 0 ? 'CIMB Niaga Sinar Mas' : 'BNI Sinar Mas Land',
      accountNumber: `888-002-${num}`,
      accountHolder: 'PT Bumi Serpong Damai Tbk',
      isPrimary: i === 0,
    };
  });

  // 4. Generate 100 Data Dummy Audit Logs per Tenant
  const auditLogsTenantA: DummyAuditLog[] = Array.from({ length: 100 }, (_, i) => {
    const num = String(i + 1).padStart(3, '0');
    return {
      id: `audit-andara-${num}`,
      tenant_id: TENANT_A,
      actorEmail: `admin_${num}@andara.co.id`,
      actorRole: 'ADMIN',
      action: 'UPDATE',
      targetEntity: 'LEAD',
      summary: `Admin Andara mengubah data lead ${num}`,
    };
  });

  const auditLogsTenantB: DummyAuditLog[] = Array.from({ length: 100 }, (_, i) => {
    const num = String(i + 1).padStart(3, '0');
    return {
      id: `audit-sinarmas-${num}`,
      tenant_id: TENANT_B,
      actorEmail: `admin_${num}@sinarmasland.com`,
      actorRole: 'ADMIN',
      action: 'CREATE',
      targetEntity: 'BANK_ACCOUNT',
      summary: `Admin BSD menambah rekening escrow BSD ${num}`,
    };
  });

  // =========================================================================
  // MATRIKS PENGUJIAN KEBOCORAN (100 PENGGUNA x 100 DUMMY DATA)
  // =========================================================================

  it('1. Read Isolation: 100 Pengguna Tenant Baru (Tenant B) membaca data Leads -> 0% Kebocoran ke Tenant A', () => {
    const allLeads = [...leadsTenantA, ...leadsTenantB];
    let totalLeaks = 0;

    for (const userB of usersTenantB) {
      const visibleLeads = filterByTenant(allLeads, userB);

      // Pastikan semua lead yang dibaca berasal murni dari Tenant B
      for (const lead of visibleLeads) {
        if (lead.tenant_id !== TENANT_B) {
          totalLeaks++;
        }
      }

      // Pastikan jumlah lead Tenant B tepat 100
      expect(visibleLeads.length).toBe(100);
      expect(visibleLeads.every((l) => l.tenant_id === TENANT_B)).toBe(true);
    }

    expect(totalLeaks).toBe(0);
  });

  it('2. Financial Isolation: 100 Pengguna Tenant B membaca Rekening Bank -> Rekening Tenant A tidak pernah bocor', () => {
    const allBankAccounts = [...bankAccountsTenantA, ...bankAccountsTenantB];
    let financialLeaks = 0;

    for (const userB of usersTenantB) {
      const visibleBanks = filterByTenant(allBankAccounts, userB);

      for (const b of visibleBanks) {
        if (b.tenant_id !== TENANT_B || b.accountHolder.includes('Andara')) {
          financialLeaks++;
        }
      }

      expect(visibleBanks.length).toBe(100);
      expect(visibleBanks.some((b) => b.accountHolder === 'PT Andara Rejo Makmur')).toBe(false);
    }

    expect(financialLeaks).toBe(0);
  });

  it('3. Audit Log Isolation: Aktivitas CRUD Tenant A tidak boleh terlihat oleh 100 Pengguna Tenant B', () => {
    const allAuditLogs = [...auditLogsTenantA, ...auditLogsTenantB];
    let auditLeaks = 0;

    for (const userB of usersTenantB) {
      const visibleLogs = filterByTenant(allAuditLogs, userB);

      for (const log of visibleLogs) {
        if (log.tenant_id !== TENANT_B || log.summary.includes('Andara')) {
          auditLeaks++;
        }
      }

      expect(visibleLogs.length).toBe(100);
      expect(visibleLogs.every((l) => l.tenant_id === TENANT_B)).toBe(true);
    }

    expect(auditLeaks).toBe(0);
  });

  it('4. Direct ID Access / IDOR Attack: 100 Pengguna Tenant B mencoba memanipulasi 100 entitas Tenant A -> Seluruhnya ditolak (TenantAccessError)', () => {
    let unauthorizedAccessCount = 0;
    let properlyBlockedCount = 0;

    // Setiap user B mencoba memodifikasi lead A bernomor sama (100 percobaan)
    for (let i = 0; i < 100; i++) {
      const userB = usersTenantB[i];
      const targetEntityA = leadsTenantA[i];

      try {
        verifyTenantOwnership(targetEntityA, userB);
        unauthorizedAccessCount++;
      } catch (err) {
        if (err instanceof TenantAccessError) {
          properlyBlockedCount++;
        }
      }
    }

    expect(unauthorizedAccessCount).toBe(0);
    expect(properlyBlockedCount).toBe(100);
  });

  it('5. Lead Pool Isolation: Lead Pool Tenant A tidak boleh muncul atau diklaim oleh SE Tenant B', () => {
    const poolLeadsA = leadsTenantA.filter((l) => l.isInPool);
    expect(poolLeadsA.length).toBe(20);

    const seUsersB = usersTenantB.filter((u) => u.role === 'SE');
    let poolHijackCount = 0;

    for (const seUserB of seUsersB) {
      // SE Tenant B melihat leads pool
      const accessiblePoolLeads = filterByTenant(poolLeadsA, seUserB);
      if (accessiblePoolLeads.length > 0) {
        poolHijackCount++;
      }

      // SE Tenant B mencoba mengklaim lead pool milik Tenant A
      for (const poolLeadA of poolLeadsA) {
        try {
          verifyTenantOwnership(poolLeadA, seUserB);
          poolHijackCount++;
        } catch (err) {
          expect(err instanceof TenantAccessError).toBe(true);
        }
      }
    }

    expect(poolHijackCount).toBe(0);
  });

  it('6. Cross-Tenant Filter Parameter Injection: User Tenant B menginjeksi header/filter targetTenantId = TENANT_A -> Ditolak keras', () => {
    let injectionSuccessCount = 0;

    for (const userB of usersTenantB) {
      expect(() => {
        // Mencoba memaksa membaca data Tenant A
        filterByTenant(leadsTenantA, userB, TENANT_A);
      }).toThrow(TenantAccessError);

      try {
        filterByTenant(leadsTenantA, userB, TENANT_A);
        injectionSuccessCount++;
      } catch {
        // Berhasil dicegah
      }
    }

    expect(injectionSuccessCount).toBe(0);
  });

  it('7. AI Credit Wallet Segregation: Kuota AI Tenant B independen dari Tenant A', () => {
    const walletA: DummyAicWallet = {
      id: 'wallet-a',
      tenant_id: TENANT_A,
      balanceAic: 5000,
      planCode: 'platinum',
    };

    const walletB: DummyAicWallet = {
      id: 'wallet-b',
      tenant_id: TENANT_B,
      balanceAic: 1000,
      planCode: 'starter',
    };

    const allWallets = [walletA, walletB];

    // User Tenant B hanya bisa melihat wallet Tenant B
    const userB = usersTenantB[0];
    const userWallet = filterByTenant(allWallets, userB);
    expect(userWallet.length).toBe(1);
    expect(userWallet[0].tenant_id).toBe(TENANT_B);
    expect(userWallet[0].balanceAic).toBe(1000);

    // User Tenant B mencoba memotong/memodifikasi wallet Tenant A
    expect(() => {
      verifyTenantOwnership(walletA, userB);
    }).toThrow(TenantAccessError);
  });

  it('8. Superadmin Global Scope: Superadmin dapat mengaudit lintas tenant atau memfilter spesifik', () => {
    const superAdmin: UserSessionContext = {
      userId: 'super-it-01',
      tenantId: null,
      role: 'SUPERADMIN',
    };

    const allLeads = [...leadsTenantA, ...leadsTenantB];
    const allBanks = [...bankAccountsTenantA, ...bankAccountsTenantB];

    // Superadmin tanpa filter melihat seluruh 200 data
    const globalLeads = filterByTenant(allLeads, superAdmin);
    expect(globalLeads.length).toBe(200);

    // Superadmin memfilter tenant baru Tenant B
    const tenantBLeads = filterByTenant(allLeads, superAdmin, TENANT_B);
    expect(tenantBLeads.length).toBe(100);
    expect(tenantBLeads.every((l) => l.tenant_id === TENANT_B)).toBe(true);

    // Superadmin memverifikasi rekening bank kedua tenant
    const globalBanks = filterByTenant(allBanks, superAdmin);
    expect(globalBanks.length).toBe(200);
  });
});
