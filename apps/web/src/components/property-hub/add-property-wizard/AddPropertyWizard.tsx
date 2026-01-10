import { IntelligenceSidebar, PropertyHeader, WizardFooter } from './components'
import {
  Step1Address,
  Step2PropertyDetails,
  Step3Ownership,
  Step4Financing,
  Step5Management,
  Step6Strategy,
} from './steps'
import {
  usePropertyFormData,
  usePropertyPersistence,
  useWizardNavigation,
} from './hooks'
import { AsyncLoader } from '@/components/loader/async-loader'
import { useCurrentUser, useDefaultPortfolio } from '@/hooks/api'

interface AddPropertyWizardProps {
  onClose: () => void
  onComplete: (propertyId?: string) => void
  portfolioId?: string // Optional - defaults to user's first portfolio or creates one
  existingPropertyId?: string // Optional - resume an existing property (from URL)
  initialStep?: number // Optional - for URL-based step tracking
  onStepChange?: (step: number, propertyId?: string) => void // Optional - callback when step changes, with optional propertyId to update URL
}

export const AddPropertyWizard = ({
  onClose,
  onComplete,
  portfolioId: propPortfolioId,
  existingPropertyId,
  initialStep = 1,
  onStepChange,
}: AddPropertyWizardProps) => {
  const totalSteps = 6

  // Get user and portfolio data
  const { data: userData } = useCurrentUser()
  const { data: portfolio } = useDefaultPortfolio()
  const userId = userData?.id || null
  const portfolioId = propPortfolioId || portfolio?.id || null

  // Property persistence - handles saving/loading/completing
  const {
    propertyId,
    setPropertyId,
    existingProperty,
    isSaving,
    saveProperty,
    completePropertyWizard,
  } = usePropertyPersistence({
    existingPropertyId,
    userId,
    portfolioId,
  })

  // Property form data management (uses existingProperty from above)
  const {
    formData,
    setFormData,
    isAddressSelected,
    addressSuggestions,
    setAddressSuggestions,
    setIsAddressSelected,
    handleAddressSelected,
    fetchRentcastData,
    resetForm,
    formatCurrency,
  } = usePropertyFormData({
    propertyId,
    userId,
    step: initialStep,
    existingProperty,
    existingPropertyId,
  })

  // Wizard navigation
  const { step, isFetchingData, isSuccess, setIsSuccess, nextStep, prevStep } =
    useWizardNavigation({
      initialStep,
      totalSteps,
      onStepChange,
      isAddressSelected,
      userId,
      portfolioId,
      saveProperty,
      fetchRentcastData,
      completePropertyWizard,
      formData, // Pass formData for saving
    })

  const calculatePI = () => {
    const p = parseFloat(formData.loanAmount.replace(/,/g, '')) || 0
    const r = (parseFloat(formData.interestRate) || 0) / 100 / 12
    const n = (parseInt(formData.loanTerm) || 30) * 12
    if (r === 0) return (p / n).toFixed(2)
    const pi = (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1)
    return pi.toLocaleString(undefined, { maximumFractionDigits: 0 })
  }

  const handleClose = () => {
    onClose()
  }

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
            onAddressSelected={handleAddressSelected}
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
      <div className="min-h-screen flex flex-col items-center justify-center p-12 bg-slate-50 dark:bg-black transition-colors duration-500">
        <div className="max-w-5xl w-full animate-in fade-in duration-1000">
          <div className="text-center mb-16">
            <div className="w-24 h-24 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto mb-8 shadow-2xl">
              <svg
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                className="animate-bounce"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h1 className="text-6xl font-black uppercase tracking-tighter mb-4 leading-none text-slate-900 dark:text-white">
              Intelligence Initialized.
            </h1>
            <p className="text-xl text-slate-500 font-bold uppercase tracking-widest italic">
              {formData.address} is now on the radar.
            </p>
          </div>

          <div className="p-10 rounded-[3.5rem] border bg-white border-slate-200 shadow-sm dark:bg-[#1A1A1A] dark:border-white/5 mb-10 flex items-center gap-8">
            <div className="w-32 h-32 rounded-[2rem] bg-slate-300 overflow-hidden shrink-0 relative shadow-2xl border-4 border-white/10">
              <div className="w-full h-full bg-gradient-to-br from-slate-400 to-slate-600"></div>
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center font-black text-white text-[9px] tracking-[0.2em] text-center px-4">
                ASSET VERIFIED
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-black uppercase tracking-tighter leading-none text-slate-900 dark:text-white">
                {formData.address}
              </h3>
              <p className="text-[11px] font-bold uppercase tracking-widest opacity-40 mt-3">
                {formData.city}, {formData.state} {formData.zipCode}
              </p>
              <div className="mt-4 flex gap-4">
                <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-emerald-500/20 text-emerald-500">
                  ✓ Deployment Ready
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-6">
            <button
              onClick={() => onComplete(propertyId || undefined)}
              className="flex-grow py-7 rounded-[2.5rem] font-black text-xs uppercase tracking-widest transition-all hover:scale-105 bg-violet-600 text-white shadow-xl shadow-violet-200 dark:bg-[#E8FF4D] dark:text-black dark:shadow-lg dark:shadow-[#E8FF4D]/20"
            >
              Deploy Full Asset Analysis
            </button>
            <button
              onClick={() => {
                setIsSuccess(false)
                resetForm()
                setPropertyId(null)
              }}
              className="px-12 py-7 rounded-[2.5rem] font-black text-xs uppercase tracking-widest border transition-all border-slate-200 text-slate-900 hover:bg-slate-50 dark:border-white/10 dark:text-white dark:hover:bg-white/5"
            >
              Add Another Asset
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <AsyncLoader isVisible={isFetchingData} duration={3000} />

      <div className="flex min-h-screen font-sans overflow-hidden bg-slate-50 dark:bg-[#0A0A0A] text-slate-900 dark:text-white transition-colors duration-500">
        {/* Left Sidebar - Logo & Nav */}
        <aside className="w-20 md:w-24 flex flex-col items-center py-10 border-r bg-white dark:bg-black border-slate-200 dark:border-white/5 shadow-xl dark:shadow-none transition-all duration-500 z-50">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-16 shadow-lg bg-slate-900 dark:bg-white text-white dark:text-black transition-colors">
            <span className="font-black italic text-xl">A</span>
          </div>
          <div className="flex flex-col gap-6 opacity-10">
            <div className="w-6 h-6 border-2 rounded-lg border-current"></div>
            <div className="w-6 h-6 border-2 rounded-lg border-current"></div>
            <div className="w-6 h-6 border-2 rounded-lg border-current"></div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-grow flex flex-col h-screen relative">
          {/* Header */}
          <PropertyHeader
            step={step}
            totalSteps={totalSteps}
            onCancel={handleClose}
          />

          {/* Content + Sidebar */}
          <div className="flex flex-grow overflow-hidden">
            {/* Main Form Section */}
            <section className="flex-grow overflow-y-auto no-scrollbar">
              <div className="p-12">
                <div className="max-w-3xl mx-auto py-12">
                  {renderStep()}

                  {/* Footer Buttons */}
                  <WizardFooter
                    step={step}
                    totalSteps={totalSteps}
                    isDisabled={step === 1 && !isAddressSelected}
                    isSaving={isSaving}
                    onBack={prevStep}
                    onNext={nextStep}
                  />
                </div>
              </div>
            </section>

            {/* Intelligence Sidebar */}
            <IntelligenceSidebar step={step} />
          </div>
        </main>
      </div>
    </>
  )
}
