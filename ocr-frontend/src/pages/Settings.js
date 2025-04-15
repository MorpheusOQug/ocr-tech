import React from "react";

function Settings() {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-6">Settings</h2>
            
            <div className="space-y-6">
                <div className="border-b border-gray-200 dark:border-gray-700 pb-5">
                    <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-4">OCR Settings</h3>
                    
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Default Recognition Mode</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Choose the default mode for OCR processing</p>
                            </div>
                            <select className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 py-1.5 pl-3 pr-8 text-sm">
                                <option value="text">Text Recognition</option>
                                <option value="table">Table Extraction</option>
                                <option value="form">Form Data</option>
                            </select>
                        </div>
                        
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Language</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Select primary language for better recognition</p>
                            </div>
                            <select className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 py-1.5 pl-3 pr-8 text-sm">
                                <option value="en">English</option>
                                <option value="fr">French</option>
                                <option value="es">Spanish</option>
                                <option value="de">German</option>
                                <option value="pt">Portuguese</option>
                            </select>
                        </div>
                        
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Confidence Threshold</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Minimum confidence score for OCR results (higher is more accurate)</p>
                            </div>
                            <select className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 py-1.5 pl-3 pr-8 text-sm">
                                <option value="0.6">60%</option>
                                <option value="0.7">70%</option>
                                <option value="0.8">80%</option>
                                <option value="0.9">90%</option>
                            </select>
                        </div>
                    </div>
                </div>
                
                <div className="border-b border-gray-200 dark:border-gray-700 pb-5">
                    <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-4">Account Settings</h3>
                    
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Email Notifications</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Receive email notifications when OCR processing is complete</p>
                            </div>
                            <div className="relative inline-block w-10 mr-2 align-middle select-none">
                                <input type="checkbox" name="toggle" id="toggle" className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"/>
                                <label htmlFor="toggle" className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 dark:bg-gray-600 cursor-pointer"></label>
                            </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Save OCR History</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Keep history of processed documents</p>
                            </div>
                            <div className="relative inline-block w-10 mr-2 align-middle select-none">
                                <input type="checkbox" name="toggle2" id="toggle2" defaultChecked className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"/>
                                <label htmlFor="toggle2" className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 dark:bg-gray-600 cursor-pointer"></label>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="pt-2 flex justify-end space-x-3">
                    <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm font-medium transition-colors">
                        Cancel
                    </button>
                    <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
                        Save Settings
                    </button>
                </div>
            </div>
        </div>
    );
}

export default Settings; 