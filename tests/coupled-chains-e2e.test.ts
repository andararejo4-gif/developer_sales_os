import { afterAll, describe, expect, it } from 'bun:test';
import { sql } from '../server/db';
import { hashPassword } from '../server/auth';
import {
  createDisputeAndHoldCommission,
  createWorkspaceItem,
  deleteWorkspaceItem,
  listWorkspaceItems,
  pickNextRoundRobinSe,
  propagateTruthChangeToWorkspaceAssets,
  registerEventRsvpToLead,
  spawnLegalMilestoneOnAkad,
  updateWorkspaceItem,
} from '../server/workspace-couplings';

const tenantA = `tnt_chain_a_${Date.now()}`;
const tenantB = `tnt_chain_b_${Date.now()}`;
const projectId = 'proj-chain-e2e';

afterAll(async () => {
  for (const tid of [tenantA, tenantB]) {
    await sql`DELETE FROM sales_os.tenant_workspace_items WHERE tenant_id = ${tid}`;
    await sql`DELETE FROM sales_os.round_robin_cursors WHERE tenant_id = ${tid}`;
    await sql`DELETE FROM sales_os.creator_ledger_entries WHERE tenant_id = ${tid}`;
    await sql`DELETE FROM sales_os.pipeline_leads WHERE tenant_id = ${tid}`;
    await sql`DELETE FROM sales_os.app_users WHERE tenant_id = ${tid}`;
  }
});

describe('6 Rantai Gandengan Fitur & Isolasi Multi-Tenant (End-to-End)', () => {
  it('Rantai 1 (F06 -> F16/F24): Perubahan harga menandai materi Tenant A NEEDS_REVIEW tanpa menyentuh Tenant B', async () => {
    await createWorkspaceItem({
      tenantId: tenantA,
      projectId,
      moduleKey: 'F16_OBJECTION_KIT',
      title: 'Skrip Harga Promo 650Jt',
      status: 'ACTIVE',
      createdBy: 'sm@a.co.id',
    });
    await createWorkspaceItem({
      tenantId: tenantB,
      projectId,
      moduleKey: 'F16_OBJECTION_KIT',
      title: 'Skrip Harga Tenant B',
      status: 'ACTIVE',
      createdBy: 'sm@b.co.id',
    });

    const flagged = await propagateTruthChangeToWorkspaceAssets({
      tenantId: tenantA,
      projectId,
      reason: 'Kenaikan harga tahap 2',
      actorEmail: 'admin@a.co.id',
    });
    expect(flagged.length).toBe(1);

    const itemsA = await listWorkspaceItems({ tenantId: tenantA, projectId, moduleKey: 'F16_OBJECTION_KIT' });
    const itemsB = await listWorkspaceItems({ tenantId: tenantB, projectId, moduleKey: 'F16_OBJECTION_KIT' });
    expect(itemsA[0].status).toBe('NEEDS_REVIEW');
    expect(itemsB[0].status).toBe('ACTIVE');
  });

  it('Rantai 2 & 6 (F46 <-> F65): Round-Robin memprioritaskan SE tersertifikasi & merotasi adil per tenant', async () => {
    const pw = hashPassword('Pass1234!');
    const se1 = `se1.${Date.now()}@a.co.id`;
    const se2 = `se2.${Date.now()}@a.co.id`;
    await sql`
      INSERT INTO sales_os.app_users (email, name, role, tenant_id, project_id, password_hash, is_active)
      VALUES
        (${se1}, 'SE Satu', 'SE', ${tenantA}, ${projectId}, ${pw}, true),
        (${se2}, 'SE Dua', 'SE', ${tenantA}, ${projectId}, ${pw}, true)
    `;

    // Sebelum ada sertifikasi: rotasi se1 -> se2 -> se1
    const first = await pickNextRoundRobinSe({ tenantId: tenantA, projectId });
    const second = await pickNextRoundRobinSe({ tenantId: tenantA, projectId });
    expect(first).toBe(se1);
    expect(second).toBe(se2);

    // Setelah hanya se2 tersertifikasi F65: lead diprioritaskan ke se2
    await createWorkspaceItem({
      tenantId: tenantA,
      projectId,
      moduleKey: 'F65_SE_CERTIFICATION',
      title: 'Lulus Uji Produk',
      status: 'CERTIFIED',
      refId: se2,
      createdBy: 'sm@a.co.id',
    });
    const prioritized = await pickNextRoundRobinSe({ tenantId: tenantA, projectId });
    expect(prioritized).toBe(se2);
  });

  it('Rantai 3 (F75 -> F76): Akad KPR otomatis membuat milestone legal F76 secara idempoten', async () => {
    const kprId = 'kpr-app-001';
    const m1 = await spawnLegalMilestoneOnAkad({
      tenantId: tenantA,
      projectId,
      kprAppId: kprId,
      applicantName: 'Bapak Adi',
      unitCode: 'Nagoya A-01',
      actorEmail: 'admin@a.co.id',
    });
    const m2 = await spawnLegalMilestoneOnAkad({
      tenantId: tenantA,
      projectId,
      kprAppId: kprId,
      applicantName: 'Bapak Adi',
      unitCode: 'Nagoya A-01',
      actorEmail: 'admin@a.co.id',
    });
    expect(m1.id).toBe(m2.id);
    const list = await listWorkspaceItems({ tenantId: tenantA, projectId, moduleKey: 'F76_LEGAL_MILESTONE' });
    expect(list.length).toBe(1);
  });

  it('Rantai 4 (F81 <-> Ledger): Sengketa komisi otomatis menahan pencairan ledger (ON_HOLD)', async () => {
    await sql`
      INSERT INTO sales_os.creator_ledger_entries (
        tenant_id, project_id, creator_code, pocket, entry_type, reference_id,
        description, gross_amount_idr, tax_pph_idr, net_amount_idr, status
      ) VALUES (
        ${tenantA}, ${projectId}, 'AC-DISP1', 'A', 'CPM', 'klip-1',
        'Klip TikTok', 300000, 7500, 292500, 'ACCRUED'
      )
    `;

    const res = await createDisputeAndHoldCommission({
      tenantId: tenantA,
      projectId,
      creatorOrBrokerCode: 'AC-DISP1',
      reason: 'Klaim ganda dengan SE',
      actorEmail: 'sm@a.co.id',
    });
    expect(res.heldLedgerCount).toBe(1);
    const rows = await sql`
      SELECT status FROM sales_os.creator_ledger_entries
      WHERE tenant_id = ${tenantA} AND creator_code = 'AC-DISP1'
    `;
    expect(rows[0].status).toBe('ON_HOLD');
  });

  it('Rantai 5 (F83 <-> pipeline_leads): RSVP Open House otomatis masuk pipeline_leads + dedup per tenant', async () => {
    const r1 = await registerEventRsvpToLead({
      tenantId: tenantA,
      projectId,
      eventId: 'ev-1',
      eventTitle: 'Open House Akhir Pekan',
      guestName: 'Ibu Sari',
      guestPhone: '0812-3344-5566',
      assignedSe: 'se1@a.co.id',
    });
    const r2 = await registerEventRsvpToLead({
      tenantId: tenantA,
      projectId,
      eventId: 'ev-1',
      eventTitle: 'Open House Akhir Pekan',
      guestName: 'Ibu Sari',
      guestPhone: '0812-3344-5566',
      assignedSe: 'se1@a.co.id',
    });
    expect(r1.leadId).toBe(r2.leadId);
  });

  it('Isolasi CRUD Workspace: Tenant B tidak boleh mengubah atau menghapus item milik Tenant A', async () => {
    const itemA = await createWorkspaceItem({
      tenantId: tenantA,
      projectId,
      moduleKey: 'F82_B2B_INSTITUTION',
      title: 'RSUD Sukoharjo',
      createdBy: 'sm@a.co.id',
    });

    const patchFail = await updateWorkspaceItem({
      tenantId: tenantB,
      id: String(itemA.id),
      title: 'Dibajak Tenant B',
    });
    const deleteFail = await deleteWorkspaceItem({
      tenantId: tenantB,
      id: String(itemA.id),
    });
    expect(patchFail).toBeNull();
    expect(deleteFail).toBe(false);
  });
});
