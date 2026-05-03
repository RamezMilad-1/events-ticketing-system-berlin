import { Link } from 'react-router-dom';

const Footer = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-gradient-to-b from-slate-900 to-slate-950 text-white mt-20">
            {/* Main Footer Content */}
            <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
                    {/* Brand Section */}
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-lg flex items-center justify-center">
                                <span className="text-white font-bold">E</span>
                            </div>
                            <span className="text-xl font-bold">EventHub</span>
                        </div>
                        <p className="text-slate-400 text-sm leading-relaxed">
                            Your ultimate platform for discovering, creating, and managing extraordinary events.
                        </p>
                        {/* Social Links */}
                        <div className="flex gap-4 mt-4">
                            <a href="#" className="text-slate-400 hover:text-indigo-400 transition-colors">
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                                </svg>
                            </a>
                            <a href="#" className="text-slate-400 hover:text-indigo-400 transition-colors">
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M23.953 4.57a10 10 0 002.856-9.093c-1.603.413-3.113.558-4.556.129-1.453-.395-2.742-1.216-3.759-2.219-1.017-1.003-2.306-1.824-3.759-2.219-1.453-.429-3.113-.284-4.556.129-1.453.413-2.742 1.216-3.759 2.219-1.017 1.003-2.306 1.824-3.759 2.219-1.453.395-2.742.284-4.556-.129-1.143-.303-2.191-.789-3.112-1.452C.068 5.187.175 7.088.715 8.97c.54 1.882 1.428 3.574 2.616 5.027 1.188 1.453 2.616 2.615 4.244 3.487 1.628.872 3.456 1.453 5.385 1.749 1.929.296 3.857.296 5.786 0 1.929-.296 3.757-.877 5.385-1.749 1.628-.872 3.056-2.034 4.244-3.487 1.188-1.453 2.076-3.145 2.616-5.027.54-1.882.647-3.783.109-5.665-1.143.713-2.191 1.199-3.112 1.452z"/>
                                </svg>
                            </a>
                            <a href="#" className="text-slate-400 hover:text-indigo-400 transition-colors">
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M19.633 7.997c.013.175.013.349.013.523 0 5.325-4.053 11.461-11.46 11.461-2.282 0-4.402-.661-6.186-1.809.324.037.636.05.973.05a8.07 8.07 0 005.001-1.72 4.021 4.021 0 01-3.756-2.773c.249.037.499.062.761.062.15 0 .3-.013.45-.038a4.014 4.014 0 01-3.224-3.937v-.05c.647.36 1.462.578 2.3.603a4.017 4.017 0 01-1.792-3.356 4.02 4.02 0 01.556-2.026 11.407 11.407 0 008.274 4.19c-.063-.3-.1-.611-.1-.923a4.026 4.026 0 014.028-4.028c1.156 0 2.202.486 2.937 1.265a7.878 7.878 0 002.556-1.01 4.022 4.022 0 01-1.771 2.237 8.034 8.034 0 002.318-.624 8.64 8.64 0 01-2.019 2.089z"/>
                                </svg>
                            </a>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h4 className="text-lg font-semibold mb-6 text-white">Explore</h4>
                        <ul className="space-y-3">
                            <li>
                                <Link to="/" className="text-slate-400 hover:text-indigo-400 transition-colors">
                                    All Events
                                </Link>
                            </li>
                            <li>
                                <Link to="/" className="text-slate-400 hover:text-indigo-400 transition-colors">
                                    Categories
                                </Link>
                            </li>
                            <li>
                                <Link to="/" className="text-slate-400 hover:text-indigo-400 transition-colors">
                                    Trending
                                </Link>
                            </li>
                            <li>
                                <Link to="/" className="text-slate-400 hover:text-indigo-400 transition-colors">
                                    New Events
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* For Organizers */}
                    <div>
                        <h4 className="text-lg font-semibold mb-6 text-white">For Organizers</h4>
                        <ul className="space-y-3">
                            <li>
                                <Link to="/register" className="text-slate-400 hover:text-indigo-400 transition-colors">
                                    Create Event
                                </Link>
                            </li>
                            <li>
                                <a href="#" className="text-slate-400 hover:text-indigo-400 transition-colors">
                                    Pricing
                                </a>
                            </li>
                            <li>
                                <a href="#" className="text-slate-400 hover:text-indigo-400 transition-colors">
                                    Resources
                                </a>
                            </li>
                            <li>
                                <a href="#" className="text-slate-400 hover:text-indigo-400 transition-colors">
                                    Support
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* Contact & Legal */}
                    <div>
                        <h4 className="text-lg font-semibold mb-6 text-white">Contact</h4>
                        <ul className="space-y-3">
                            <li>
                                <a href="mailto:support@eventhub.com" className="text-slate-400 hover:text-indigo-400 transition-colors">
                                    support@eventhub.com
                                </a>
                            </li>
                            <li>
                                <a href="tel:+15551234567" className="text-slate-400 hover:text-indigo-400 transition-colors">
                                    +1 (555) 123-4567
                                </a>
                            </li>
                            <li>
                                <p className="text-slate-400">
                                    123 Event Street<br/>
                                    San Francisco, CA 94103
                                </p>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom Divider */}
                <div className="mt-12 pt-8 border-t border-slate-800"></div>

                {/* Bottom Section */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <p className="text-slate-400 text-sm">
                        &copy; {currentYear} EventHub. All rights reserved.
                    </p>
                    <div className="flex gap-6 text-sm">
                        <a href="#" className="text-slate-400 hover:text-indigo-400 transition-colors">
                            Privacy Policy
                        </a>
                        <a href="#" className="text-slate-400 hover:text-indigo-400 transition-colors">
                            Terms of Service
                        </a>
                        <a href="#" className="text-slate-400 hover:text-indigo-400 transition-colors">
                            Cookie Policy
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer; 