import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Step = 'DESCRIPTION' | 'FINANCIAL_DETAILS' | 'EVIDENCE' | 'REVIEW' | 'SUCCESS';

interface ReportState {
  step: Step;
  
  // Step 1: Description
  description: string;
  category: string | null;
  isFinancialFraud: boolean;
  
  // Step 2: Financial Details
  bankAccount: string;
  amount: string;
  freezeRequested: boolean;
  
  // Step 3: Evidence
  evidenceFile: string | null; // Just storing mock file name for prototype

  // Output
  ackNumber: string | null;

  // Actions
  setStep: (step: Step) => void;
  setDescription: (desc: string) => void;
  setTriageResult: (category: string, isFinancial: boolean) => void;
  setFinancialDetails: (bankAccount: string, amount: string) => void;
  setFreezeRequested: (requested: boolean) => void;
  setEvidence: (fileName: string) => void;
  setSuccess: (ack: string) => void;
  reset: () => void;
}

export const useReportStore = create<ReportState>()(
  persist(
    (set) => ({
      step: 'DESCRIPTION',
      description: '',
      category: null,
      isFinancialFraud: false,
      bankAccount: '',
      amount: '',
      freezeRequested: false,
      evidenceFile: null,
      ackNumber: null,

      setStep: (step) => set({ step }),
      setDescription: (description) => set({ description }),
      setTriageResult: (category, isFinancialFraud) => set({ category, isFinancialFraud }),
      setFinancialDetails: (bankAccount, amount) => set({ bankAccount, amount }),
      setFreezeRequested: (freezeRequested) => set({ freezeRequested }),
      setEvidence: (evidenceFile) => set({ evidenceFile }),
      setSuccess: (ackNumber) => set({ step: 'SUCCESS', ackNumber }),
      
      reset: () => set({
        step: 'DESCRIPTION',
        description: '',
        category: null,
        isFinancialFraud: false,
        bankAccount: '',
        amount: '',
        freezeRequested: false,
        evidenceFile: null,
        ackNumber: null,
      }),
    }),
    {
      name: 'casepilot-report-storage',
    }
  )
);
