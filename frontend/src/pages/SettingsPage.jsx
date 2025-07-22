import { Themes } from "../constants";
import { useTheme } from "../store/useThemes";
import { Send, Check } from "lucide-react";
import { useState } from "react";

const PREVIEW_MESSAGES = [
  { id: 1, content: "Hey! How's it going?", isSent: false },
  { id: 2, content: "I'm doing great! Just working on some new features.", isSent: true },
];

export const SettingsPage = () => {
  const { theme, setTheme } = useTheme();
  const [animatePreview, setAnimatePreview] = useState(false);

  const handleThemeChange = (t) => {
    setTheme(t);
    setAnimatePreview(true);
    setTimeout(() => setAnimatePreview(false), 400);
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-950 via-slate-900 to-blue-900 flex items-start justify-center py-12 px-2">
      <div className="w-full max-w-4xl bg-base-100/90 rounded-3xl shadow-2xl flex flex-col gap-10 p-8">
        <div className="flex flex-col gap-1 mb-2">
          <h2 className="text-2xl font-bold text-white mb-1">Theme</h2>
          <p className="text-base text-base-content/70">Choose a theme for your chat interface</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4 mb-8">
          {Themes.map((t) => (
            <button
              key={t}
              className={`
                group flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all duration-200 relative
                ${theme === t ? "border-blue-500 bg-blue-950/40 scale-105 shadow-lg" : "border-transparent hover:border-blue-400 hover:bg-blue-900/30"}
                focus:outline-none focus:ring-2 focus:ring-blue-400
              `}
              aria-label={`Select ${t} theme`}
              onClick={() => handleThemeChange(t)}
            >
              <div className="relative h-8 w-16 rounded-md overflow-hidden" data-theme={t}>
                <div className="absolute inset-0 grid grid-cols-4 gap-px p-1">
                  <div className="rounded bg-primary"></div>
                  <div className="rounded bg-secondary"></div>
                  <div className="rounded bg-accent"></div>
                  <div className="rounded bg-neutral"></div>
                </div>
                {theme === t && (
                  <span className="absolute -top-2 -right-2 bg-blue-500 text-white rounded-full p-1 shadow-md animate-bounce">
                    <Check size={16} />
                  </span>
                )}
              </div>
              <span className="text-xs font-medium truncate w-full text-center text-white/90">
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </span>
            </button>
          ))}
        </div>
        <h3 className="text-xl font-semibold mb-3 text-white">Preview</h3>
        <div className={`rounded-2xl border border-base-300 overflow-hidden bg-base-100 shadow-xl transition-transform duration-500 ${animatePreview ? 'scale-105 ring-4 ring-blue-400/30' : ''}`}>
          <div className="p-4 bg-base-200">
            <div className="max-w-lg mx-auto">
              <div className="bg-base-100 rounded-xl shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-base-300 bg-base-100">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-primary-content font-bold text-lg">
                      SS
                    </div>
                    <div>
                      <h3 className="font-semibold text-base">Sourav Sethi</h3>
                      <p className="text-xs text-base-content/70">Online</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 space-y-4 min-h-[200px] max-h-[200px] overflow-y-auto bg-base-100">
                  {PREVIEW_MESSAGES.map((message, idx) => (
                    <div
                      key={message.id}
                      className={`flex transition-all duration-300 ${message.isSent ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`
                          max-w-[80%] rounded-2xl px-4 py-3 shadow-md relative
                          ${message.isSent ? "bg-blue-600 text-white animate-fade-in-right" : "bg-base-200 animate-fade-in-left"}
                        `}
                        style={{ animationDelay: `${idx * 100}ms` }}
                      >
                        <p className="text-sm">{message.content}</p>
                        <p
                          className={`
                            text-[10px] mt-1.5
                            ${message.isSent ? "text-white/70" : "text-base-content/70"}
                          `}
                        >
                          12:00 PM
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-4 border-t border-base-300 bg-base-100">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      className="input input-bordered flex-1 text-sm h-10 rounded-lg focus:ring-2 focus:ring-blue-400"
                      placeholder="Type a message..."
                      value="This is a preview"
                      readOnly
                    />
                    <button className="btn btn-primary h-10 min-h-0 rounded-lg hover:scale-105 transition-transform">
                      <Send size={18} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};