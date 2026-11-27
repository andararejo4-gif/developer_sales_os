// ============================================================================
// FINAL 15 FEATURES ENGINE: F72, F73, F76-F78, F81-F84, F87-F89, F94-F96
// ============================================================================

export type Final15FeatureId =
  | 'F72' | 'F73' | 'F76' | 'F77' | 'F78'
  | 'F81' | 'F82' | 'F83' | 'F84' | 'F87'
  | 'F88' | 'F89' | 'F94' | 'F95' | 'F96';

export const FINAL_15_META: Record<Final15FeatureId, { moduleKey: string; label: string; aic: number }> = {
  F72: { moduleKey: 'F72_PORTFOLIO_INVENTORY', label: 'F72 Portfolio Inventory', aic: 200 },
  F73: { moduleKey: 'F73_KPR_CHECKLIST', label: 'F73 KPR Readiness', aic: 20 },
  F76: { moduleKey: 'F76_LEGAL_MILESTONE', label: 'F76 Legal Milestone', aic: 100 },
  F77: { moduleKey: 'F77_PAYMENT_RECON', label: 'F77 Payment Recon', aic: 80 },
  F78: { moduleKey: 'F78_CLOSING_RESCUE', label: 'F78 Closing Rescue', aic: 100 },
  F81: { moduleKey: 'F81_COMMISSION_DISPUTE', label: 'F81 Commission & Dispute', aic: 50 },
  F82: { moduleKey: 'F82_B2B_INSTITUTION', label: 'F82 Corporate Outreach', aic: 150 },
  F83: { moduleKey: 'F83_OPEN_HOUSE_EVENT', label: 'F83 Open House Event', aic: 200 },
  F84: { moduleKey: 'F84_PARTNER_PERF', label: 'F84 Partner Performance', aic: 120 },
  F87: { moduleKey: 'F87_INCREMENTALITY', label: 'F87 Attribution & Incrementality', aic: 200 },
  F88: { moduleKey: 'F88_REVENUE_FORECAST', label: 'F88 Revenue & Sell-Through Forecast', aic: 300 },
  F89: { moduleKey: 'F89_BAST_DLP_REFERRAL', label: 'F89 BAST, DLP & Referral', aic: 100 },
  F94: { moduleKey: 'F94_ERP_CONNECTORS', label: 'F94 Official ERP/API Sync', aic: 150 },
  F95: { moduleKey: 'F95_AGENT_EVAL', label: 'F95 Agent Eval & Rollback', aic: 300 },
  F96: { moduleKey: 'F96_ENTERPRISE_SSO', label: 'F96 Enterprise SSO & BYOK', aic: 300 },
};

export function executeFinal15Feature(featureId: Final15FeatureId, input: Record<string, any>) {
  switch (featureId) {
    case 'F72': {
      const sellableStock = Number(input.sellableStock ?? 10);
      const proposedUnits = Number(input.proposedUnits ?? 5);
      if (proposedUnits > sellableStock) {
        return { ok: false as const, error: 'Optimasi tidak boleh melebihi stok sellable (F72).' };
      }
      return {
        ok: true as const,
        title: `Optimasi Inventory (${proposedUnits}/${sellableStock} unit)`,
        status: 'PENDING_APPROVAL',
        data: { featureId, sellableStock, proposedUnits, recommendationOnly: true, requiresApproval: true },
      };
    }
    case 'F73': {
      const emp = String(input.employmentType || 'KARYAWAN').toUpperCase();
      const docs = emp === 'WIRAUSAHA'
        ? ['KTP/KK', 'NPWP', 'SIUP/NIB', 'Rekening Koran 6 bln']
        : ['KTP/KK', 'NPWP', 'Slip Gaji 3 bln', 'SK Kerja'];
      return {
        ok: true as const,
        title: `Checklist KPR (${emp})`,
        status: 'ACTIVE',
        data: { featureId, employmentType: emp, docs, voluntaryInput: true, noFinalBankCreditScore: true, piiProtected: true },
      };
    }
    case 'F76': {
      if (!input.counselApprovedTemplate) {
        return { ok: false as const, error: 'Template kontrak wajib berstatus counsel-approved (F76).' };
      }
      const milestone = String(input.milestone || 'PPJB').toUpperCase();
      return {
        ok: true as const,
        title: `Legal Milestone ${milestone}`,
        status: 'DRAFT_ASSEMBLY',
        data: { featureId, milestone, counselApprovedTemplate: true, aiCannotFinalizeLegalContract: true },
      };
    }
    case 'F77': {
      if (!input.webhookSignatureVerified) {
        return { ok: false as const, error: 'Webhook bank/PSP wajib tervalidasi signature (F77).' };
      }
      if (Number(input.whitelistedAccountApprovers ?? 2) < 2) {
        return { ok: false as const, error: 'Rekening tujuan whitelist wajib disetujui minimal 2 approver (F77).' };
      }
      return {
        ok: true as const,
        title: `Rekonsiliasi Pembayaran ${input.paymentRef || 'PAY-1'}`,
        status: 'PENDING_FINANCE_VERIFY',
        data: { featureId, financeApprovalRequired: true, whitelistedAccountApprovers: Number(input.whitelistedAccountApprovers ?? 2) },
      };
    }
    case 'F78': {
      if (!String(input.evidenceRef || '').trim()) {
        return { ok: false as const, error: 'Blocker, expiry, atau pembatalan wajib menyertakan bukti (F78).' };
      }
      return {
        ok: true as const,
        title: `Closing Rescue (${input.blockerType || 'SP3K_EXPIRE'})`,
        status: 'ACTIVE',
        data: { featureId, sp3kIsNotAutoAkad: true, blocksLegitimateRefund: false, evidenceRef: input.evidenceRef },
      };
    }
    case 'F81': {
      return {
        ok: true as const,
        title: `Accrual/Dispute Komisi (${input.partnerCode || 'P-01'})`,
        status: input.isDispute ? 'DISPUTE_OPEN' : 'ACCRUED',
        data: { featureId, financeApprovalForPayout: true, version: Number(input.version || 1), evidenceRef: input.evidenceRef || 'CONTRACT-V1' },
      };
    }
    case 'F82': {
      if (input.harvestsEmployeeOrPatientDb) {
        return { ok: false as const, error: 'Dilarang mengambil database pegawai/pasien/siswa tanpa dasar (F82).' };
      }
      if (!input.slotPermitVerified) {
        return { ok: false as const, error: 'Izin slot institusional wajib terverifikasi (F82).' };
      }
      return {
        ok: true as const,
        title: `Outreach Institusi: ${input.institutionName || 'RS/Kampus'}`,
        status: 'ACTIVE',
        data: { featureId, institutionalChannelOnly: true, slotPermitVerified: true },
      };
    }
    case 'F83': {
      return {
        ok: true as const,
        title: `Event Open House: ${input.eventName || 'Weekend Showcase'}`,
        status: 'ACTIVE',
        data: { featureId, rsvpWithConsent: true, physicalBoothAndPermitsOutOfFreeScope: true },
      };
    }
    case 'F84': {
      const net = Number(input.netSalesIdr ?? 0) - Number(input.costIdr ?? 0);
      return {
        ok: true as const,
        title: `Performa Partner (${input.partnerCode || 'KOL-01'})`,
        status: 'ACTIVE',
        data: {
          featureId,
          netMarginIdr: net,
          attributionWindowDays: Number(input.attributionWindowDays ?? 30),
          followerCountIsNotNetSale: true,
          incentiveConflictVisible: Boolean(input.hasIncentiveConflict),
        },
      };
    }
    case 'F87': {
      return {
        ok: true as const,
        title: `Incrementality & Attribution (${input.periodLabel || 'Q4'})`,
        status: 'ACTIVE',
        data: {
          featureId,
          gmvIsNotSoftwareRevenue: true,
          observationalSeparatedFromHoldout: true,
          holdoutLiftPct: Number(input.holdoutLiftPct ?? 8.5),
        },
      };
    }
    case 'F88': {
      const months = Number(input.historyMonths ?? 6);
      const insufficient = months < 3;
      return {
        ok: true as const,
        title: `Forecast Revenue (${insufficient ? 'Skenario Asumsi' : `${months} Bln Histori`})`,
        status: 'ACTIVE',
        data: {
          featureId,
          historyMonths: months,
          mode: insufficient ? 'ASSUMPTION_SCENARIO_ONLY' : 'INTERVAL_FORECAST',
          sellableStock: Number(input.sellableStock ?? 10),
        },
      };
    }
    case 'F89': {
      if (input.fakeTestimonial) {
        return { ok: false as const, error: 'Dilarang membuat review atau testimoni palsu (F89).' };
      }
      if (!input.statusConfirmedByCustomerOrAdmin) {
        return { ok: false as const, error: 'Status tiket DLP/BAST memerlukan konfirmasi (F89).' };
      }
      return {
        ok: true as const,
        title: `BAST/DLP Unit ${input.unitCode || 'A-01'}`,
        status: 'ACTIVE',
        data: { featureId, voluntaryReferralOnly: true, statusConfirmed: true },
      };
    }
    case 'F94': {
      if (input.bypassClosedApi) {
        return { ok: false as const, error: 'Dilarang membypass API tertutup (F94).' };
      }
      if (input.tokenRevoked) {
        return { ok: false as const, error: 'TOKEN_REVOKED: Sync ERP dihentikan dan masuk DLQ (F94).' };
      }
      return {
        ok: true as const,
        title: `ERP/API Sync (${input.erpName || 'Accurate/SAP'})`,
        status: 'ACTIVE',
        data: { featureId, authoritativeSourcePerField: true, dlqReady: true },
      };
    }
    case 'F95': {
      if (!input.testSetPassed) {
        return { ok: false as const, error: 'Test set evaluasi wajib lulus sebelum canary/publish workflow (F95).' };
      }
      return {
        ok: true as const,
        title: `Agent Eval ${input.promptVersion || 'v1.2'} (${input.riskyChange ? 'Wait Approver' : 'Canary'})`,
        status: input.riskyChange ? 'PENDING_APPROVER' : 'CANARY_ACTIVE',
        data: { featureId, rollbackTarget: input.rollbackTarget || 'v1.1', requiresApprover: Boolean(input.riskyChange) },
      };
    }
    case 'F96': {
      if (!input.contractualDueDiligenceSigned) {
        return { ok: false as const, error: 'SSO/SCIM/BYOK mengikuti kontrak/due diligence, bukan janji default (F96).' };
      }
      return {
        ok: true as const,
        title: `Enterprise SSO/BYOK (${input.idpProvider || 'Okta/Entra'})`,
        status: input.idpDown ? 'IDP_FALLBACK_ADMIN' : 'ACTIVE',
        data: { featureId, keyRotationReady: true, region: input.region || 'ap-southeast-3' },
      };
    }
  }
}
