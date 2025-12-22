import type { OnboardingForm } from '../hooks/useOnboardingForm'

interface Step1NameCollectionProps {
  form: OnboardingForm
  onNext: () => void
  isDark: boolean
}

export function Step1NameCollection({
  form,
  onNext,
  isDark,
}: Step1NameCollectionProps) {
  return (
    <div className="animate-in fade-in duration-500">
      <h3 className="text-huge mb-12">Welcome! Let's get started.</h3>
      <div
        className={`p-16 rounded-[4rem] border transition-colors ${
          isDark
            ? 'bg-[#1A1A1A] border-white/5'
            : 'bg-white border-black/5 shadow-2xl'
        }`}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault()
            form.handleSubmit()
          }}
          className="space-y-6"
        >
          <form.Field name="firstName">
            {(field) => (
              <div>
                <label className="block text-sm font-black uppercase tracking-widest mb-2">
                  First Name
                </label>
                <input
                  type="text"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  className={`w-full px-6 py-4 rounded-2xl border font-medium ${
                    isDark
                      ? 'bg-white/5 border-white/10 text-white'
                      : 'bg-slate-50 border-black/10 text-slate-900'
                  }`}
                  placeholder="John"
                />
                {field.state.meta.errors && field.state.meta.errors.length > 0 && (
                  <p className="text-red-500 text-sm mt-1">
                    {field.state.meta.errors[0]}
                  </p>
                )}
              </div>
            )}
          </form.Field>

          <form.Field name="lastName">
            {(field) => (
              <div>
                <label className="block text-sm font-black uppercase tracking-widest mb-2">
                  Last Name
                </label>
                <input
                  type="text"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  className={`w-full px-6 py-4 rounded-2xl border font-medium ${
                    isDark
                      ? 'bg-white/5 border-white/10 text-white'
                      : 'bg-slate-50 border-black/10 text-slate-900'
                  }`}
                  placeholder="Doe"
                />
                {field.state.meta.errors && field.state.meta.errors.length > 0 && (
                  <p className="text-red-500 text-sm mt-1">
                    {field.state.meta.errors[0]}
                  </p>
                )}
              </div>
            )}
          </form.Field>

          <form.Subscribe
            selector={(state) => [
              state.isValid,
              state.values.firstName,
              state.values.lastName,
            ]}
          >
            {([isValid, firstName, lastName]) => (
              <button
                type="submit"
                disabled={!isValid || !firstName || !lastName}
                onClick={async (e) => {
                  e.preventDefault()
                  await form.handleSubmit()
                  if (isValid && firstName && lastName) {
                    onNext()
                  }
                }}
                className={`w-full py-6 rounded-3xl font-black text-xs uppercase tracking-widest transition-all ${
                  isValid && firstName && lastName
                    ? isDark
                      ? 'bg-[#E8FF4D] text-black shadow-lg shadow-[#E8FF4D]/20'
                      : 'bg-violet-600 text-white shadow-xl shadow-violet-200'
                    : 'opacity-20 cursor-not-allowed'
                }`}
              >
                Continue
              </button>
            )}
          </form.Subscribe>
        </form>
      </div>
    </div>
  )
}

