"use client";

import { useState } from "react";
import { useEffect } from "react";
import { ScrollReveal } from "@/components/ScrollReveal";
import { Mail, MapPin } from "lucide-react";

const contacts = [
  { label: "General", email: "hello@urisocial.com" },
  { label: "Sales", email: "sales@urisocial.com" },
  { label: "Support", email: "support@urisocial.com" },
  { label: "Careers", email: "careers@uricreative.com" },
  { label: "Press", email: "press@uricreative.com" },
];

const Contact = () => {
  const [formData, setFormData] = useState({ name: "", email: "", subject: "General Inquiry", message: "" });

  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div className="min-h-screen">
      <section className="pt-28 pb-16" style={{
        backgroundColor: 'hsl(12 100% 98%)',
        backgroundImage: 'radial-gradient(circle, hsl(340 74% 42% / 0.04) 1px, transparent 1px)',
        backgroundSize: '20px 20px'
      }}>
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black mb-5" style={{
            color: 'hsl(330 40% 7%)',
            textTransform: 'uppercase',
            letterSpacing: '-0.02em',
            lineHeight: '1.05'
          }}>
            Let's <span style={{
              background: 'linear-gradient(180deg, transparent 55%, hsl(45 100% 51% / 0.4) 55%)',
              padding: '0 4px'
            }}>Talk</span>
          </h1>
          <p className="text-lg max-w-2xl mx-auto" style={{
            color: 'hsl(0 0% 40%)',
            fontWeight: 'bold'
          }}>
            Whether it's a question, a partnership idea, or you just want to say hi — we're here.
          </p>
        </div>
      </section>

      <section className="py-20" style={{
        backgroundColor: 'hsl(0 0% 100%)',
        backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.06) 1px, transparent 1px)',
        backgroundSize: '16px 16px'
      }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-10">
            {/* Left */}
            <ScrollReveal>
              <div className="space-y-6">
                <div className="p-6" style={{
                  backgroundColor: 'hsl(12 100% 98%)',
                  border: '3px solid hsl(0 0% 7%)',
                  borderRadius: '8px',
                  boxShadow: '6px 6px 0px hsl(0 0% 7%)',
                  overflow: 'hidden'
                }}>
                  <h3 className="text-base font-black uppercase mb-4" style={{ color: 'hsl(330 40% 7%)' }}>
                    Get in touch
                  </h3>
                  <ul className="space-y-3">
                    {contacts.map((c) => (
                      <li key={c.label} className="flex items-center gap-3">
                        <Mail className="w-4 h-4 shrink-0" style={{ color: 'hsl(340 74% 42%)' }} />
                        <span className="text-sm font-bold" style={{ color: 'hsl(330 40% 7% / 0.7)' }}>
                          <strong style={{ color: 'hsl(330 40% 7%)' }}>{c.label}:</strong>{' '}
                          <a href={`mailto:${c.email}`} className="hover:underline" style={{ color: 'hsl(340 74% 42%)' }}>
                            {c.email}
                          </a>
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-6" style={{
                  backgroundColor: 'hsl(12 100% 98%)',
                  border: '3px solid hsl(0 0% 7%)',
                  borderRadius: '8px',
                  boxShadow: '6px 6px 0px hsl(0 0% 7%)',
                  overflow: 'hidden'
                }}>
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 shrink-0 mt-0.5" style={{ color: 'hsl(340 74% 42%)' }} />
                    <div>
                      <h3 className="text-base font-black uppercase mb-1" style={{ color: 'hsl(330 40% 7%)' }}>
                        Office
                      </h3>
                      <p className="text-sm font-bold" style={{ color: 'hsl(330 40% 7% / 0.7)' }}>
                        URI Creative<br />Lagos, Nigeria 🇳🇬
                      </p>
                      <p className="text-xs font-bold mt-2 italic" style={{ color: 'hsl(0 0% 40%)' }}>
                        "We're remote-first, but our hearts (and servers) are in Lagos."
                      </p>
                    </div>
                  </div>
                </div>

                <div className="relative p-4" style={{
                  backgroundColor: 'hsl(0 0% 100%)',
                  border: '3px solid hsl(0 0% 7%)',
                  borderRadius: '16px',
                  padding: '16px 20px',
                  fontWeight: '700'
                }}>
                  <p className="text-sm font-bold italic" style={{ color: 'hsl(330 40% 7% / 0.8)' }}>
                    "We typically reply within 4 hours during business hours (WAT). Jane replies instantly, obviously."
                  </p>
                  <style jsx>{`
                    div:last-child::after {
                      content: '';
                      position: absolute;
                      bottom: -16px;
                      left: 30px;
                      border-width: 16px 12px 0;
                      border-style: solid;
                      border-color: hsl(0 0% 7%) transparent transparent;
                    }
                    div:last-child::before {
                      content: '';
                      position: absolute;
                      bottom: -12px;
                      left: 32px;
                      border-width: 12px 10px 0;
                      border-style: solid;
                      border-color: hsl(0 0% 100%) transparent transparent;
                      z-index: 1;
                    }
                  `}</style>
                </div>
              </div>
            </ScrollReveal>

            {/* Right - Form */}
            <ScrollReveal>
              <div className="p-6" style={{
                backgroundColor: 'hsl(12 100% 98%)',
                border: '3px solid hsl(0 0% 7%)',
                borderRadius: '8px',
                boxShadow: '6px 6px 0px hsl(0 0% 7%)',
                overflow: 'hidden'
              }}>
                <h3 className="text-base font-black uppercase mb-6" style={{ color: 'hsl(330 40% 7%)' }}>
                  Send a message
                </h3>
                <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                  <div>
                    <label className="text-sm font-black uppercase block mb-1" style={{ color: 'hsl(330 40% 7%)' }}>
                      Name
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full rounded-lg px-4 py-2.5 text-sm font-bold focus:outline-none"
                      style={{
                        border: '3px solid hsl(330 40% 7%)',
                        backgroundColor: 'hsl(12 100% 98%)',
                        color: 'hsl(330 40% 7%)'
                      }}
                      onFocus={(e) => e.target.style.borderColor = 'hsl(340 74% 42%)'}
                      onBlur={(e) => e.target.style.borderColor = 'hsl(330 40% 7%)'}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-black uppercase block mb-1" style={{ color: 'hsl(330 40% 7%)' }}>
                      Email
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full rounded-lg px-4 py-2.5 text-sm font-bold focus:outline-none"
                      style={{
                        border: '3px solid hsl(330 40% 7%)',
                        backgroundColor: 'hsl(12 100% 98%)',
                        color: 'hsl(330 40% 7%)'
                      }}
                      onFocus={(e) => e.target.style.borderColor = 'hsl(340 74% 42%)'}
                      onBlur={(e) => e.target.style.borderColor = 'hsl(330 40% 7%)'}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-black uppercase block mb-1" style={{ color: 'hsl(330 40% 7%)' }}>
                      Subject
                    </label>
                    <select
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className="w-full rounded-lg px-4 py-2.5 text-sm font-bold focus:outline-none"
                      style={{
                        border: '3px solid hsl(330 40% 7%)',
                        backgroundColor: 'hsl(12 100% 98%)',
                        color: 'hsl(330 40% 7%)'
                      }}
                      onFocus={(e) => e.target.style.borderColor = 'hsl(340 74% 42%)'}
                      onBlur={(e) => e.target.style.borderColor = 'hsl(330 40% 7%)'}
                    >
                      {["General Inquiry", "Sales / Enterprise", "Support", "Partnership", "Press", "Other"].map((o) => <option key={o}>{o}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-black uppercase block mb-1" style={{ color: 'hsl(330 40% 7%)' }}>
                      Message
                    </label>
                    <textarea
                      rows={5}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full rounded-lg px-4 py-2.5 text-sm font-bold resize-none focus:outline-none"
                      style={{
                        border: '3px solid hsl(330 40% 7%)',
                        backgroundColor: 'hsl(12 100% 98%)',
                        color: 'hsl(330 40% 7%)'
                      }}
                      onFocus={(e) => e.target.style.borderColor = 'hsl(340 74% 42%)'}
                      onBlur={(e) => e.target.style.borderColor = 'hsl(330 40% 7%)'}
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-6 py-3 rounded-lg text-sm w-full font-bold uppercase transition-all"
                    style={{
                      backgroundColor: 'hsl(340 74% 42%)',
                      color: 'hsl(0 0% 100%)',
                      border: '3px solid hsl(0 0% 7%)',
                      boxShadow: '4px 4px 0px hsl(0 0% 7%)',
                      letterSpacing: '0.5px'
                    }}
                    onMouseDown={(e) => {
                      e.currentTarget.style.boxShadow = '0px 0px 0px hsl(0 0% 7%)';
                      e.currentTarget.style.transform = 'translate(4px, 4px)';
                    }}
                    onMouseUp={(e) => {
                      e.currentTarget.style.boxShadow = '4px 4px 0px hsl(0 0% 7%)';
                      e.currentTarget.style.transform = 'translate(0, 0)';
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = '2px 2px 0px hsl(0 0% 7%)';
                      e.currentTarget.style.transform = 'translate(2px, 2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = '4px 4px 0px hsl(0 0% 7%)';
                      e.currentTarget.style.transform = 'translate(0, 0)';
                    }}
                  >
                    Send Message →
                  </button>
                </form>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;
