// src/pages/BookingSuccess.jsx
import { useLocation, useNavigate, Navigate } from "react-router-dom";
import { Check, ExternalLink, ChevronLeft } from "lucide-react";

export default function BookingSuccess() {
  const { state } = useLocation();
  const navigate = useNavigate();

  if (!state) {
    return <Navigate to="/" replace />;
  }

  const {
    bookerName,
    bookerEmail,
    eventTitle,
    duration,
    displayDate,
    startSlot,
    endSlot,
  } = state;

  return (
    <div className="min-h-screen bg-[#111111] flex flex-col items-center pt-20 px-4 font-sans text-white pb-10 relative">
      <button 
        onClick={() => navigate("/")}
        className="absolute top-6 left-6 sm:top-8 sm:left-8 flex items-center gap-2 text-[14px] font-semibold text-neutral-400 hover:text-white transition-all hover:bg-neutral-800 px-4 py-2 rounded-full border border-neutral-800 bg-[#1C1C1C]"
      >
        <ChevronLeft className="h-4 w-4" strokeWidth={2.5} />
        Main Page
      </button>

      <div className="w-full max-w-[600px] flex flex-col items-center">
        
        {/* Success Icon */}
        <div className="w-12 h-12 rounded-full border border-emerald-900/50 bg-[#1C1C1C] flex items-center justify-center mb-6">
          <Check className="h-6 w-6 text-emerald-500" strokeWidth={3} />
        </div>

        <h1 className="text-3xl font-bold tracking-tight mb-2">This meeting is scheduled</h1>
        <p className="text-[15px] text-neutral-400 mb-10 text-center">
          We sent an email with a calendar invitation with the details to everyone.
        </p>

        <div className="w-full bg-[#1C1C1C] border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl">
          
          <div className="p-8 flex flex-col gap-6">
            
            {/* What */}
            <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-6">
              <div className="w-16 shrink-0 text-[15px] font-semibold text-white">What</div>
              <div className="text-[15px] text-neutral-300 font-medium">
                {duration} min meeting between {bookerName} and Lalit Kumar
              </div>
            </div>

            {/* When */}
            <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-6">
              <div className="w-16 shrink-0 text-[15px] font-semibold text-white">When</div>
              <div className="text-[15px] text-neutral-300 font-medium">
                {displayDate}<br />
                {startSlot} – {endSlot} <span className="text-neutral-500 font-normal">(India Standard Time)</span>
              </div>
            </div>

            {/* Who */}
            <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-6">
              <div className="w-16 shrink-0 text-[15px] font-semibold text-white">Who</div>
              <div className="flex flex-col gap-4">
                <div>
                  <div className="text-[15px] text-neutral-300 font-medium flex items-center gap-2">
                    Lalit Kumar <span className="px-1.5 py-0.5 rounded text-[11px] font-bold bg-indigo-900/50 text-indigo-400 leading-none">Host</span>
                  </div>
                  <div className="text-[15px] text-neutral-500">rachnadevi618@gmail.com</div>
                </div>
                <div>
                  <div className="text-[15px] text-neutral-300 font-medium">
                    {bookerName}
                  </div>
                  <div className="text-[15px] text-neutral-500">{bookerEmail}</div>
                </div>
              </div>
            </div>

            {/* Where */}
            <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-6">
              <div className="w-16 shrink-0 text-[15px] font-semibold text-white">Where</div>
              <div className="text-[15px] text-neutral-300 font-medium flex items-center gap-2">
                Cal Video <ExternalLink className="h-4 w-4 text-neutral-400" />
              </div>
            </div>

          </div>

          <div className="border-t border-neutral-800 p-8 flex flex-col items-center">
            <div className="flex items-center gap-4">
              <span className="text-[15px] font-semibold text-white">Add to calendar</span>
              <div className="flex items-center gap-2">
                <button className="w-10 h-10 rounded-xl border border-neutral-700 flex items-center justify-center hover:bg-neutral-800 transition-colors">
                  <span className="text-lg font-bold text-neutral-300">G</span>
                </button>
                <button className="w-10 h-10 rounded-xl border border-neutral-700 flex items-center justify-center hover:bg-neutral-800 transition-colors">
                  <span className="text-xs font-bold text-neutral-300">O365</span>
                </button>
                <button className="w-10 h-10 rounded-xl border border-neutral-700 flex items-center justify-center hover:bg-neutral-800 transition-colors">
                  <span className="text-lg font-bold text-neutral-300">O</span>
                </button>
              </div>
            </div>
          </div>
          
          <div className="border-t border-neutral-800 bg-[#161616] p-5 text-center">
            <p className="text-[14px] text-neutral-500">
              Need to make a change? <button onClick={() => navigate("/")} className="text-neutral-400 underline decoration-neutral-600 hover:text-white transition-colors">Reschedule</button> or <button onClick={() => navigate("/")} className="text-neutral-400 underline decoration-neutral-600 hover:text-white transition-colors">Cancel</button>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
