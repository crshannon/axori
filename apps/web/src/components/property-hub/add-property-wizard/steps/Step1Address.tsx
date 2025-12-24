import { X } from 'lucide-react'
import { Heading, Overline } from '@axori/ui'
import type { PropertyFormData } from '../types'
import { StepperTitle } from '../components'

interface Step1AddressProps {
  formData: PropertyFormData
  setFormData: React.Dispatch<React.SetStateAction<PropertyFormData>>
  addressSuggestions: Array<string>
  setAddressSuggestions: React.Dispatch<React.SetStateAction<Array<string>>>
  isAddressSelected: boolean
  setIsAddressSelected: React.Dispatch<React.SetStateAction<boolean>>
}

export const Step1Address = ({
  formData,
  setFormData,
  addressSuggestions,
  setAddressSuggestions,
  isAddressSelected,
  setIsAddressSelected,
}: Step1AddressProps) => {
  const handleAddressChange = (val: string) => {
    setFormData({ ...formData, address: val })
    if (val.length > 5) {
      setAddressSuggestions([
        `${val} Blvd, Austin, TX 78704`,
        `${val} Lane, Greensboro, NC 27401`,
        `${val} St, Denver, CO 80202`,
      ])
    } else {
      setAddressSuggestions([])
    }
  }

  const selectAddress = (addr: string) => {
    const parts = addr.split(', ')
    setFormData({
      ...formData,
      address: parts[0],
      city: parts[1],
      state: parts[2].split(' ')[0],
      zip: parts[2].split(' ')[1],
    })
    setAddressSuggestions([])
    setIsAddressSelected(true)
  }

  return (
    <div className="w-full max-w-2xl text-center animate-in slide-in-from-right-8 duration-500">
      <StepperTitle
        title="Let's add your property"
        subtitle="Start by entering the asset location"
      />

      <div className="relative mb-12">
        {!isAddressSelected && (
          <>
            <svg
              className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-400"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>

            <input
              type="text"
              value={formData.address}
              onChange={(e) => handleAddressChange(e.target.value)}
              placeholder="Enter Street Address..."
              className="w-full pl-20 pr-8 py-6 rounded-[2.5rem] text-lg font-black uppercase border outline-none transition-all bg-white border-slate-200 focus:border-violet-300 shadow-xl shadow-violet-100/20 dark:bg-white/5 dark:border-white/5 dark:focus:border-[#E8FF4D]/30 dark:shadow-none dark:text-white"
            />
          </>
        )}

        {addressSuggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-4 p-4 rounded-3xl border shadow-2xl z-50 overflow-hidden bg-white border-slate-200 dark:bg-[#1A1A1A] dark:border-white/10">
            {addressSuggestions.map((s, idx) => (
              <button
                key={idx}
                onClick={() => selectAddress(s)}
                className="w-full p-6 text-left text-sm font-black text-black dark:text-white uppercase tracking-tight rounded-2xl transition-all hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer"
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      {isAddressSelected && (
        <div className="p-8 rounded-[2.5rem] border text-left flex items-center justify-between gap-8 animate-in zoom-in duration-300 bg-slate-50 border-slate-100 dark:bg-black dark:border-white/5">
          <div className="flex items-center gap-8 flex-1 min-w-0">
            <div className="w-24 h-24 rounded-2xl bg-slate-300 overflow-hidden shrink-0 relative">
              <img
                src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&q=80&w=200"
                className="w-full h-full object-cover grayscale"
                alt="Preview"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="3"
                >
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 0 1 0-5 2.5 2.5 0 0 1 0 5z" />
                </svg>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <Heading
                level={5}
                className="leading-none text-black dark:text-white"
              >
                {formData.address}
              </Heading>
              <Overline className="opacity-40 mt-1 text-black dark:text-white">
                {formData.city}, {formData.state} {formData.zip}
              </Overline>
            </div>
          </div>
          <button
            onClick={() => {
              setIsAddressSelected(false)
              setFormData({
                ...formData,
                address: '',
                city: '',
                state: '',
                zip: '',
              })
            }}
            className="p-2 rounded-xl transition-all opacity-40 hover:opacity-100 text-slate-900 hover:bg-slate-100 dark:text-white dark:hover:bg-white/10 shrink-0 cursor-pointer"
          >
            <X size={20} strokeWidth={3} />
          </button>
        </div>
      )}
    </div>
  )
}

