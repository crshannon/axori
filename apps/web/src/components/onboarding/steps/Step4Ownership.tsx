import type { OnboardingForm } from '../hooks/useOnboardingForm'

interface Step4OwnershipProps {
  form: OnboardingForm
  onNext: () => void
  isDark: boolean
}

export function Step4Ownership({ form, onNext, isDark }: Step4OwnershipProps) {
  return (
    <div className="animate-in fade-in duration-500">
      <h3 className="text-huge mb-12">Ownership Structure</h3>
      <form.Field name="ownership">
        {(ownershipField) => (
          <form.Field name="llcName">
            {(llcNameField) => {
              const isLLC = ownershipField.state.value === 'LLC'
              const hasLLCName =
                llcNameField.state.value &&
                llcNameField.state.value.trim().length > 0
              const canProceed = !isLLC || hasLLCName

              return (
                <div
                  className={`p-16 rounded-[4rem] border flex flex-col items-center gap-12 text-center transition-colors ${
                    isDark
                      ? 'bg-[#1A1A1A] border-white/5'
                      : 'bg-white border-black/5 shadow-2xl'
                  }`}
                >
                  <div className="flex bg-slate-500/10 p-2 rounded-3xl w-full max-w-sm">
                    <button
                      type="button"
                      onClick={() => {
                        ownershipField.handleChange('Personal')
                        llcNameField.handleChange('')
                      }}
                      className={`flex-1 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${
                        ownershipField.state.value === 'Personal'
                          ? isDark
                            ? 'bg-white text-black'
                            : 'bg-slate-900 text-white'
                          : 'opacity-40'
                      }`}
                    >
                      Personal
                    </button>
                    <button
                      type="button"
                      onClick={() => ownershipField.handleChange('LLC')}
                      className={`flex-1 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${
                        ownershipField.state.value === 'LLC'
                          ? isDark
                            ? 'bg-white text-black'
                            : 'bg-slate-900 text-white'
                          : 'opacity-40'
                      }`}
                    >
                      Legal Entity (LLC)
                    </button>
                  </div>

                  {isLLC && (
                    <div className="w-full max-w-sm">
                      <label
                        htmlFor="llc-name"
                        className={`block text-left text-sm font-medium mb-2 ${
                          isDark ? 'text-white/80' : 'text-slate-700'
                        }`}
                      >
                        LLC Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="llc-name"
                        type="text"
                        value={llcNameField.state.value || ''}
                        onChange={(e) =>
                          llcNameField.handleChange(e.target.value)
                        }
                        placeholder="Enter your LLC name"
                        className={`w-full px-4 py-3 rounded-xl border font-medium bg-transparent ${
                          isDark
                            ? 'border-white/10 text-white placeholder:text-white/40'
                            : 'border-black/10 text-slate-900 placeholder:text-slate-400'
                        } ${
                          llcNameField.state.meta.errors.length > 0
                            ? 'border-red-500'
                            : ''
                        }`}
                      />
                      {llcNameField.state.meta.errors.length > 0 && (
                        <p className="text-red-500 text-xs mt-1 text-left">
                          {llcNameField.state.meta.errors[0]}
                        </p>
                      )}
                    </div>
                  )}

                  <p className="text-sm font-medium opacity-50 max-w-sm">
                    This helps us customize your tax reports and legal climate
                    notifications.
                  </p>
                  <button
                    type="button"
                    onClick={onNext}
                    disabled={!canProceed}
                    className={`w-full py-6 rounded-3xl font-black text-xs uppercase tracking-widest transition-all ${
                      canProceed
                        ? isDark
                          ? 'bg-[#E8FF4D] text-black shadow-lg shadow-[#E8FF4D]/20'
                          : 'bg-violet-600 text-white shadow-xl shadow-violet-200'
                        : 'opacity-50 cursor-not-allowed'
                    }`}
                  >
                    Confirm Structure
                  </button>
                </div>
              )
            }}
          </form.Field>
        )}
      </form.Field>
    </div>
  )
}
