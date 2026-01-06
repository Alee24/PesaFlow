import React, { useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { X, Mail } from 'lucide-react';
import { Button } from './Button';

interface EmailModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSend: (email: string) => Promise<void>;
    isLoading?: boolean;
    defaultEmail?: string;
    title?: string;
}

export const EmailModal = ({
    isOpen,
    onClose,
    onSend,
    isLoading = false,
    defaultEmail = '',
    title = 'Send via Email'
}: EmailModalProps) => {
    const [email, setEmail] = useState(defaultEmail);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (email) {
            await onSend(email);
            onClose();
        }
    };

    // Update local state if default changes when opening (optional, simpler to just use state)
    React.useEffect(() => {
        if (isOpen && defaultEmail) setEmail(defaultEmail);
    }, [isOpen, defaultEmail]);

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                                <div className="flex justify-between items-center mb-4">
                                    <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900 flex items-center gap-2">
                                        <Mail className="w-5 h-5 text-indigo-600" />
                                        {title}
                                    </Dialog.Title>
                                    <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <form onSubmit={handleSubmit} className="mt-4">
                                    <p className="text-sm text-gray-500 mb-4">
                                        Enter the email address where you'd like to send this document.
                                    </p>

                                    <div className="mb-6">
                                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                                            Recipient Email
                                        </label>
                                        <input
                                            type="email"
                                            id="email"
                                            required
                                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            placeholder="customer@example.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                        />
                                    </div>

                                    <div className="flex justify-end gap-3">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={onClose}
                                            disabled={isLoading}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            type="submit"
                                            disabled={isLoading || !email}
                                        >
                                            {isLoading ? 'Sending...' : 'Send Email'}
                                        </Button>
                                    </div>
                                </form>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
};
