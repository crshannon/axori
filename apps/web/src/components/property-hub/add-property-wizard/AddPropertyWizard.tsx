import { useState } from 'react'
import { X } from 'lucide-react'
import { Caption, Heading, Overline } from '@axori/ui'
import { ProgressHeader } from './components'
import {
  Step1Address,
  Step2PropertyDetails,
  Step3Ownership,
  Step4Financing,
  Step5Management,
  Step6Strategy,
} from './steps'
import type { PropertyFormData } from './types'
import { cn } from '@/utils/helpers'

interface AddPropertyWizardProps {
  onClose: () => void
  onComplete: () => void
}

export const AddPropertyWizard = ({
  onClose,
  onComplete,
}: AddPropertyWizardProps) => {
  const [step, setStep] = useState(1)
  const totalSteps = 6
  const [isSuccess, setIsSuccess] = useState(false)

  // Form State
  const [formData, setFormData] = useState<PropertyFormData>({
    address: '',
    city: '',
    state: '',
    zip: '',
    propType: 'Single Family',
    beds: 3,
    baths: 2,
    sqft: 1800,
    yearBuilt: 2010,
    lotSize: 5000,
    purchaseDate: '',
    purchasePrice: '',
    closingCosts: '',
    currentValue: '450,000',
    entityType: 'Personal',
    entityName: '',
    financeType: 'Mortgage',
    loanType: 'Conventional',
    loanAmount: '',
    interestRate: '6.5',
    loanTerm: '30',
    provider: '',
    isRented: 'Yes',
    rentAmount: '2,500',
    leaseEnd: '',
    tenantName: '',
    mgmtType: 'Self-Managed',
    pmCompany: '',
    strategy: '',
  })

  const [addressSuggestions, setAddressSuggestions] = useState<Array<string>>(
    [],
  )
  const [isAddressSelected, setIsAddressSelected] = useState(false)

  const calculatePI = () => {
    const p = parseFloat(formData.loanAmount.replace(/,/g, '')) || 0
    const r = (parseFloat(formData.interestRate) || 0) / 100 / 12
    const n = (parseInt(formData.loanTerm) || 30) * 12
    if (r === 0) return (p / n).toFixed(2)
    const pi = (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1)
    return pi.toLocaleString(undefined, { maximumFractionDigits: 0 })
  }

  const nextStep = () => {
    if (step < totalSteps) setStep(step + 1)
    else setIsSuccess(true)
  }

  const prevStep = () => setStep(Math.max(1, step - 1))

  const formatCurrency = (val: string) => {
    const numeric = val.replace(/\D/g, '')
    return numeric.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  }

  const cardClass = cn(
    'p-10 rounded-[3rem] border transition-all duration-500',
    'bg-white border-slate-200 shadow-xl',
    'dark:bg-[#1A1A1A] dark:border-white/5',
  )

  const renderStep = () => {
    const stepProps = {
      formData,
      setFormData,
      formatCurrency,
    }

    switch (step) {
      case 1:
        return (
          <Step1Address
            {...stepProps}
            addressSuggestions={addressSuggestions}
            setAddressSuggestions={setAddressSuggestions}
            isAddressSelected={isAddressSelected}
            setIsAddressSelected={setIsAddressSelected}
          />
        )
      case 2:
        return <Step2PropertyDetails {...stepProps} />
      case 3:
        return <Step3Ownership {...stepProps} />
      case 4:
        return <Step4Financing {...stepProps} calculatePI={calculatePI} />
      case 5:
        return <Step5Management {...stepProps} />
      case 6:
        return <Step6Strategy {...stepProps} />
      default:
        return null
    }
  }

  if (isSuccess) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md animate-in fade-in">
        <div
          className={`max-w-xl w-full ${cardClass} text-center overflow-hidden relative`}
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-sky-500 to-[#E8FF4D]"></div>

          <div className="my-10">
            <div className="w-24 h-24 rounded-full mx-auto flex items-center justify-center mb-8 bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-500">
              <svg
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                className="animate-in zoom-in duration-500"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <Heading level={2} className="mb-4 text-black dark:text-white">
              Property Added!
            </Heading>
            <Caption className="text-slate-500 dark:text-white/70">
              Mission Intel Successfully Logged
            </Caption>
          </div>

          <div className="p-6 rounded-[2.5rem] border text-left mb-10 flex items-center gap-6 bg-slate-50 border-slate-100 dark:bg-black/40 dark:border-white/10">
            <div className="w-20 h-20 rounded-2xl bg-slate-500/10 flex items-center justify-center text-3xl font-black opacity-20">
              A
            </div>
            <div>
              <Heading level={5} className="text-black dark:text-white">
                {formData.address}
              </Heading>
              <Overline className="opacity-40 text-black dark:text-white">
                {formData.city}, {formData.state}
              </Overline>
              <div className="flex gap-4 mt-2">
                <div className="flex items-center gap-1">
                  <span className="text-[9px] font-black uppercase text-emerald-500">
                    Score Pending
                  </span>
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <button
              onClick={onComplete}
              className="w-full py-6 rounded-3xl text-black text-xs uppercase tracking-widest transition-all hover:scale-105 bg-violet-600 text-white shadow-xl shadow-violet-200 dark:bg-[#E8FF4D] dark:text-black dark:shadow-lg dark:shadow-[#E8FF4D]/20"
            >
              View Property Details
            </button>
            <button
              onClick={() => {
                setIsSuccess(false)
                setStep(1)
                setFormData({ ...formData, address: '', strategy: '' })
                setIsAddressSelected(false)
              }}
              className="w-full py-6 rounded-3xl font-black text-xs uppercase tracking-widest border transition-all border-slate-200 text-slate-900 hover:bg-slate-50 dark:border-white/10 dark:text-white dark:hover:bg-white/5"
            >
              Add Another Asset
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md animate-in fade-in overflow-y-auto">
      <div
        className={`max-w-4xl w-full ${cardClass} relative overflow-hidden flex flex-col min-h-[700px]`}
      >
        {/* Header Control */}
        <div className="flex justify-between items-center mb-8 relative z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black italic text-sm bg-slate-900 text-white dark:bg-white dark:text-black">
              A
            </div>
            <Overline className="opacity-40 text-black dark:text-white">
              System Asset Deployment
            </Overline>
          </div>
          <button
            onClick={onClose}
            className="p-3 rounded-xl transition-all opacity-40 hover:opacity-100 text-slate-900 hover:bg-red-50 hover:text-red-600 dark:text-white dark:hover:bg-red-500/10 dark:hover:text-red-500"
          >
            <X size={24} strokeWidth={3} />
          </button>
        </div>

        <ProgressHeader step={step} totalSteps={totalSteps} />

        <div className="flex-grow flex flex-col items-center">
          {renderStep()}
        </div>

        {/* Footer Navigation */}
        <div className="mt-6 pt-6 flex items-center justify-between border-t transition-colors sticky bottom-0 z-20 bg-white border-slate-200 dark:bg-[#1A1A1A] dark:border-white/5">
          <div className="flex gap-4">
            {step > 1 && (
              <button
                onClick={prevStep}
                className="px-8 py-4 rounded-2xl font-medium font-black text-black dark:text-white text-xs uppercase tracking-widest opacity-40 hover:opacity-100 transition-opacity cursor-pointer"
              >
                Back
              </button>
            )}
          </div>

          <div className="flex gap-6 items-center">
            <span className="hidden sm:inline text-xs font-black text-black dark:text-white uppercase tracking-[0.3em] opacity-30">
              Step {step} / {totalSteps}
            </span>
            <button
              onClick={nextStep}
              disabled={step === 1 && !isAddressSelected}
              className={cn(
                'px-12 py-5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all text-white',
                step === 1 && !isAddressSelected
                  ? 'opacity-20 cursor-not-allowed grayscale text-slate-900 dark:text-white'
                  : 'bg-violet-600 shadow-xl shadow-violet-200 hover:scale-105 dark:bg-[#E8FF4D] dark:text-black dark:shadow-lg dark:shadow-[#E8FF4D]/20',
              )}
            >
              {step === totalSteps ? 'Add Property' : 'Continue'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
