'use client';

import { useState, useEffect } from 'react';
import { Upload, X, Search } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface LimboRequestFormProps {
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
}

export default function LimboRequestForm({ onSubmit, onCancel }: LimboRequestFormProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  
  // Check if user is CS or Sales
  useEffect(() => {
    fetchUserProfile();
  }, [user]);

  const fetchUserProfile = async () => {
    if (!user) return;
    try {
      const response = await fetch('/api/user/profile');
      if (response.ok) {
        const profile = await response.json();
        setUserProfile(profile);
        // Auto-populate sales rep name if user is sales rep
        if (profile?.role === 'sales_rep' || profile?.department === 'sales') {
          setFormData(prev => ({
            ...prev,
            sales_rep_name: profile.full_name || user.email || ''
          }));
        }
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const isCustomerService = userProfile?.role === 'customer_service' || 
                           userProfile?.department === 'cs' || 
                           userProfile?.department === 'customer_service';
  const isSalesRep = userProfile?.role === 'sales_rep' || userProfile?.department === 'sales';
  
  const [formData, setFormData] = useState({
    type: '',
    // Common fields
    name_of_item: '',
    brand_specific: false,
    brand_name: '',
    reference_link: '',
    preferred_vendor: '',
    stock_double_check: false,
    par_requested: '',
    prev_price: '',
    case_pack_number: '',
    previous_case_count: '',
    // Conditional fields
    products_field: '',
    special_order_qty: '',
    quote_field: '',
    existing_sku_search: '',
    sp_customer_field: '',
    // User info
    creator_name: user?.full_name || user?.email || '',
    creator_email: user?.email || '',
    sales_rep_name: '',
  });

  const typeOptions = [
    'New Stock Item',
    'Specialty',
    'Need Better Pricing',
    'New Source Please',
    'Sample ONLY - Rush',
    'Convert to Stock',
    'Update Par-Request from Sales'
  ];

  const handleTypeChange = (type: string) => {
    setFormData({ ...formData, type });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      setFormData({ ...formData, [name]: (e.target as HTMLInputElement).checked });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachments([...attachments, ...files]);
  };

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation based on type
    if (!formData.type) {
      alert('Please select a request type');
      return;
    }

    if (formData.type === 'New Stock Item' && !formData.name_of_item) {
      alert('Item name is required for New Stock Item');
      return;
    }

    setLoading(true);
    try {
      // Upload attachments first if any
      let attachmentUrls: string[] = [];
      if (attachments.length > 0) {
        // TODO: Implement file upload to Supabase Storage
        // For now, we'll skip actual upload
      }

      await onSubmit({
        ...formData,
        par_requested: formData.par_requested ? parseInt(formData.par_requested) : null,
        prev_price: formData.prev_price ? parseFloat(formData.prev_price) : null,
        case_pack_number: formData.case_pack_number ? parseInt(formData.case_pack_number) : null,
        previous_case_count: formData.previous_case_count ? parseInt(formData.previous_case_count) : null,
        special_order_qty: formData.special_order_qty ? parseInt(formData.special_order_qty) : null,
        attachments: attachmentUrls,
      });
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setLoading(false);
    }
  };

  // Conditional rendering based on type
  const renderFieldsByType = () => {
    switch (formData.type) {
      case 'New Stock Item':
        return (
          <>
            <p className="text-xs text-gray-500 -mt-2 mb-4">
              Products the client requests us to keep in stock for them. If this is an item that the client needs to confirm that they approve of pricing before we place it on order.
            </p>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Par Requested <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="par_requested"
                  value={formData.par_requested}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prev Price <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    step="0.01"
                    name="prev_price"
                    value={formData.prev_price}
                    onChange={handleInputChange}
                    className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Previous Case Count <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="previous_case_count"
                value={formData.previous_case_count}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </>
        );


      case 'Specialty':
        return (
          <>
            <p className="text-xs text-gray-500 -mt-2 mb-4">
              A product not normally in stock that we will need to add to our inventory.
            </p>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Products Field
              </label>
              <textarea
                name="products_field"
                value={formData.products_field}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={2}
                placeholder="Describe the specialty product..."
              />
              <p className="text-xs text-gray-500 mt-1">
                Check this for products that should be requested
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Special Order Qty <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="special_order_qty"
                value={formData.special_order_qty}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quote Field
              </label>
              <input
                type="text"
                name="quote_field"
                value={formData.quote_field}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </>
        );

      case 'Need Better Pricing':
        return (
          <>
            <p className="text-xs text-gray-500 -mt-2 mb-4">
              Request better pricing for existing items.
            </p>
          </>
        );

      case 'New Source Please':
        return (
          <>
            <p className="text-xs text-gray-500 -mt-2 mb-4">
              Request a new source/vendor for items.
            </p>
          </>
        );

      case 'Sample ONLY - Rush':
        return (
          <>
            <p className="text-xs text-gray-500 -mt-2 mb-4">
              Rush request for sample items only.
            </p>
          </>
        );

      case 'Convert to Stock':
        return (
          <>
            <p className="text-xs text-gray-500 -mt-2 mb-4">
              Convert a special order item to regular stock.
            </p>
          </>
        );

      case 'Update Par-Request from Sales':
        return (
          <>
            <p className="text-xs text-gray-500 -mt-2 mb-4">
              Update par quantities for existing stock items.
            </p>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Existing SKU Search
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  name="existing_sku_search"
                  value={formData.existing_sku_search}
                  onChange={handleInputChange}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Search for SKU..."
                />
                <button
                  type="button"
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center"
                >
                  <Search className="h-4 w-4 mr-2" />
                  Find
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Search for existing SKU to update
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quote
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  name="quote_field"
                  value={formData.quote_field}
                  onChange={handleInputChange}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Search for quote..."
                />
                <button
                  type="button"
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center"
                >
                  <Search className="h-4 w-4 mr-2" />
                  Find
                </button>
              </div>
            </div>
          </>
        );

      default:
        return null;
    }
  };


  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="space-y-6">
        {/* Type Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            TYPE REQUIRED <span className="text-red-500">*</span>
          </label>
          <select
            name="type"
            value={formData.type}
            onChange={(e) => handleTypeChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          >
            <option value="">Select...</option>
            {typeOptions.map((option) => (
              <option key={option} value={option} className={
                option === 'New Stock Item' ? 'bg-cyan-100' :
                option === 'Specialty' ? 'bg-blue-100' :
                option === 'Need Better Pricing' ? 'bg-teal-100' :
                option === 'New Source Please' ? 'bg-green-100' :
                option === 'Sample ONLY - Rush' ? 'bg-yellow-100' :
                option === 'Convert to Stock' ? 'bg-orange-100' :
                option === 'Update Par-Request from Sales' ? 'bg-purple-100' : ''
              }>
                {option}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            New Stock Item - Products the client requests us to keep in stock for them
          </p>
        </div>

        {/* Common Fields - Always Visible */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Name of Item
            </label>
            <textarea
              name="name_of_item"
              value={formData.name_of_item}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={2}
              placeholder="Describe the item or request..."
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              name="brand_specific"
              checked={formData.brand_specific}
              onChange={handleInputChange}
              className="h-4 w-4 text-blue-600 rounded border-gray-300"
            />
            <label className="ml-2 text-sm font-medium text-gray-700">
              Brand Specific
            </label>
          </div>

          {formData.brand_specific && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Brand Name
              </label>
              <input
                type="text"
                name="brand_name"
                value={formData.brand_name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reference Link
            </label>
            <textarea
              name="reference_link"
              value={formData.reference_link}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={2}
              placeholder="Add any reference links or URLs..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Preferred Vendor
            </label>
            <input
              type="text"
              name="preferred_vendor"
              value={formData.preferred_vendor}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter preferred vendor if any..."
            />
          </div>


          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                SP Customer
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  name="sp_customer_field"
                  value={formData.sp_customer_field}
                  onChange={handleInputChange}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Search..."
                />
                <button
                  type="button"
                  className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  <Search className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sales Rep
              </label>
              {isCustomerService ? (
                <div className="flex space-x-2">
                  <input
                    type="text"
                    name="sales_rep_name"
                    value={formData.sales_rep_name}
                    onChange={handleInputChange}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Search for sales rep..."
                  />
                  <button
                    type="button"
                    className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                  >
                    <Search className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <input
                  type="text"
                  name="sales_rep_name"
                  value={formData.sales_rep_name || userProfile?.full_name || user?.email || 'Current User'}
                  className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg cursor-not-allowed"
                  disabled
                  readOnly
                />
              )}
            </div>
          </div>
        </div>

        {/* Type-Specific Fields */}
        {formData.type && renderFieldsByType()}

        {/* File Attachments */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Attachments
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
            <input
              type="file"
              multiple
              onChange={handleFileUpload}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="flex flex-col items-center cursor-pointer"
            >
              <Upload className="h-8 w-8 text-gray-400 mb-2" />
              <span className="text-sm text-gray-600">Click to upload files</span>
              <span className="text-xs text-gray-500">PDF, Images, Excel (Max 10MB each)</span>
            </label>
          </div>
          
          {attachments.length > 0 && (
            <div className="mt-3 space-y-2">
              {attachments.map((file, index) => (
                <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                  <span className="text-sm text-gray-700">{file.name}</span>
                  <button
                    type="button"
                    onClick={() => removeAttachment(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Creator Info (Auto-filled) */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Request Information</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Creator:</span>
              <span className="ml-2 text-gray-900">{formData.creator_name}</span>
            </div>
            <div>
              <span className="text-gray-500">Email:</span>
              <span className="ml-2 text-gray-900">{formData.creator_email}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Submitting...' : 'Submit Request'}
          </button>
        </div>
      </div>
    </form>
  );
}