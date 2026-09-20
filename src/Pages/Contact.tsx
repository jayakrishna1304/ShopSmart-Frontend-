import { useState, type SyntheticEvent } from "react";
import emailjs from "@emailjs/browser";
import "../Contact.css";

interface ContactFormData {
    name: string;
    email: string;
    phone: string;
    subject: string;
    message: string;
}

const INITIAL_FORM: ContactFormData = {
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
};

export default function Contact() {
    const [form, setForm] = useState<ContactFormData>(INITIAL_FORM);
    const [submitting, setSubmitting] = useState(false);
    const [status, setStatus] = useState<{
        type: "success" | "error";
        message: string;
    } | null>(null);

    const handleChange = (
        event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = event.target;

        setForm((current) => ({
            ...current,
            [name]: value,
        }));

        if (status) {
            setStatus(null);
        }
    };

    const handleSubmit = async (event: SyntheticEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (
            !form.name.trim() ||
            !form.email.trim() ||
            !form.subject.trim() ||
            !form.message.trim()
        ) {
            setStatus({
                type: "error",
                message: "Please fill in all required fields.",
            });
            return;
        }

        try {
            setSubmitting(true);
            setStatus(null);

            /*
             * Keep the recipient email OUT of the frontend.
             * Configure the recipient in your EmailJS email template.
             *
             * VITE_EMAILJS_SERVICE_ID
             * VITE_EMAILJS_TEMPLATE_ID
             * VITE_EMAILJS_PUBLIC_KEY
             */
            const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
            const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
            const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

            if (!serviceId || !templateId || !publicKey) {
                throw new Error(
                    "Email service is not configured yet. Please add the EmailJS environment variables."
                );
            }

            await emailjs.send(
                serviceId,
                templateId,
                {
                    from_name: form.name.trim(),
                    from_email: form.email.trim(),
                    phone: form.phone.trim() || "Not provided",
                    subject: form.subject.trim(),
                    message: form.message.trim(),
                    reply_to: form.email.trim(),
                },
                {
                    publicKey,
                }
            );

            setStatus({
                type: "success",
                message:
                    "Thanks! Your message has been sent successfully. I'll get back to you soon.",
            });

            setForm(INITIAL_FORM);
        } catch (error) {
            console.error("Contact form submission failed:", error);

            setStatus({
                type: "error",
                message:
                    "Sorry, your message could not be sent right now. Please try again.",
            });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <main className="contact-page">
            <section className="contact-hero">
                <div className="contact-container">
                    <div className="contact-hero-content">
                        <span className="contact-eyebrow">
                            <span className="contact-eyebrow-dot"></span>
                            LET'S CONNECT
                        </span>

                        <h1>
                            Have a project
                            <span> in mind?</span>
                        </h1>

                        <p>
                            Whether you have a question, a project idea, or
                            simply want to connect, send a message and let's
                            start a conversation.
                        </p>

                        <div className="contact-trust-row">
                            <div className="contact-trust-item">
                                <span className="contact-trust-icon">
                                    <i className="bi bi-lightning-charge-fill"></i>
                                </span>
                                <div>
                                    <strong>Quick response</strong>
                                    <small>Usually within 24–48 hours</small>
                                </div>
                            </div>

                            <div className="contact-trust-item">
                                <span className="contact-trust-icon">
                                    <i className="bi bi-shield-check"></i>
                                </span>
                                <div>
                                    <strong>Private & secure</strong>
                                    <small>Your details stay confidential</small>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="contact-section">
                <div className="contact-container contact-grid">
                    <aside className="contact-info-card">
                        <div className="contact-card-glow"></div>

                        <div className="contact-info-content">
                            <span className="contact-card-label">
                                GET IN TOUCH
                            </span>

                            <h2>Let's build something meaningful.</h2>

                            <p>
                                Have an opportunity, collaboration idea, or
                                something you'd like to discuss? The easiest
                                way to reach me is through the form.
                            </p>

                            <div className="contact-info-list">
                                <div className="contact-info-item">
                                    <div className="contact-info-icon">
                                        <i className="bi bi-envelope-fill"></i>
                                    </div>
                                    <div>
                                        <span>EMAIL</span>
                                        <strong>Send a message below</strong>
                                    </div>
                                </div>

                                <div className="contact-info-item">
                                    <div className="contact-info-icon">
                                        <i className="bi bi-chat-dots-fill"></i>
                                    </div>
                                    <div>
                                        <span>QUERIES</span>
                                        <strong>Projects · Careers · Collaboration</strong>
                                    </div>
                                </div>

                                <div className="contact-info-item">
                                    <div className="contact-info-icon">
                                        <i className="bi bi-clock-fill"></i>
                                    </div>
                                    <div>
                                        <span>RESPONSE</span>
                                        <strong>Within 24–48 hours</strong>
                                    </div>
                                </div>
                            </div>

                            <div className="contact-social-note">
                                <i className="bi bi-stars"></i>
                                <span>
                                    Looking forward to hearing from you.
                                </span>
                            </div>
                        </div>
                    </aside>

                    <div className="contact-form-card">
                        <div className="contact-form-header">
                            <div>
                                <span className="contact-card-label">
                                    SEND A QUERY
                                </span>
                                <h2>Start a conversation</h2>
                            </div>

                            <div className="contact-form-icon">
                                <i className="bi bi-send-fill"></i>
                            </div>
                        </div>

                        {status && (
                            <div
                                className={`contact-alert ${
                                    status.type === "success"
                                        ? "contact-alert-success"
                                        : "contact-alert-error"
                                }`}
                                role="alert"
                            >
                                <i
                                    className={
                                        status.type === "success"
                                            ? "bi bi-check-circle-fill"
                                            : "bi bi-exclamation-circle-fill"
                                    }
                                ></i>
                                <span>{status.message}</span>

                                <button
                                    type="button"
                                    aria-label="Close notification"
                                    onClick={() => setStatus(null)}
                                >
                                    ×
                                </button>
                            </div>
                        )}

                        <form
                            className="contact-form"
                            onSubmit={handleSubmit}
                            noValidate
                        >
                            <div className="contact-form-row">
                                <div className="contact-field">
                                    <label htmlFor="contact-name">
                                        Your name
                                        <span>*</span>
                                    </label>
                                    <div className="contact-input-wrap">
                                        <i className="bi bi-person"></i>
                                        <input
                                            id="contact-name"
                                            name="name"
                                            type="text"
                                            value={form.name}
                                            onChange={handleChange}
                                            placeholder="Enter your name"
                                            autoComplete="name"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="contact-field">
                                    <label htmlFor="contact-email">
                                        Email address
                                        <span>*</span>
                                    </label>
                                    <div className="contact-input-wrap">
                                        <i className="bi bi-envelope"></i>
                                        <input
                                            id="contact-email"
                                            name="email"
                                            type="email"
                                            value={form.email}
                                            onChange={handleChange}
                                            placeholder="you@example.com"
                                            autoComplete="email"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="contact-form-row">
                                <div className="contact-field">
                                    <label htmlFor="contact-phone">
                                        Phone number
                                        <small>Optional</small>
                                    </label>
                                    <div className="contact-input-wrap">
                                        <i className="bi bi-telephone"></i>
                                        <input
                                            id="contact-phone"
                                            name="phone"
                                            type="tel"
                                            value={form.phone}
                                            onChange={handleChange}
                                            placeholder="Your phone number"
                                            autoComplete="tel"
                                        />
                                    </div>
                                </div>

                                <div className="contact-field">
                                    <label htmlFor="contact-subject">
                                        Subject
                                        <span>*</span>
                                    </label>
                                    <div className="contact-input-wrap">
                                        <i className="bi bi-bookmark"></i>
                                        <input
                                            id="contact-subject"
                                            name="subject"
                                            type="text"
                                            value={form.subject}
                                            onChange={handleChange}
                                            placeholder="What would you like to discuss?"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="contact-field">
                                <label htmlFor="contact-message">
                                    Your message
                                    <span>*</span>
                                </label>
                                <div className="contact-textarea-wrap">
                                    <i className="bi bi-chat-left-text"></i>
                                    <textarea
                                        id="contact-message"
                                        name="message"
                                        value={form.message}
                                        onChange={handleChange}
                                        placeholder="Tell me a little about your query, idea, or opportunity..."
                                        rows={7}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="contact-form-footer">
                                <p>
                                    <i className="bi bi-lock-fill"></i>
                                    Your information is used only to respond
                                    to your query.
                                </p>

                                <button
                                    type="submit"
                                    className="contact-submit-button"
                                    disabled={submitting}
                                >
                                    {submitting ? (
                                        <>
                                            <span
                                                className="contact-spinner"
                                                aria-hidden="true"
                                            ></span>
                                            Sending...
                                        </>
                                    ) : (
                                        <>
                                            Send message
                                            <i className="bi bi-arrow-up-right"></i>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </section>
        </main>
    );
}
