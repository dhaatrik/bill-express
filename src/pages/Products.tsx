import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, Filter, ArrowUpDown } from 'lucide-react';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  
  // Search, Filter, Sort state
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [sortBy, setSortBy] = useState('name_asc');
  
  // Delete confirmation state
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    category: 'Fertilizer',
    unit: 'Bag',
    price_ex_gst: '',
    gst_rate: '5',
    hsn_code: '',
    stock: '0'
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    const res = await apiFetch('/api/products');
    const data = await res.json();
    setProducts(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingProduct ? `/api/products/${editingProduct.id}` : '/api/products';
    const method = editingProduct ? 'PUT' : 'POST';
    
    try {
      const payload = {
        ...formData,
        price_ex_gst: parseFloat(formData.price_ex_gst),
        gst_rate: parseFloat(formData.gst_rate),
        stock: parseFloat(formData.stock)
      };

      const res = await apiFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        alert(`Error: ${errorData.error || 'Failed to save product'}`);
        return;
      }
      
      setIsModalOpen(false);
      setEditingProduct(null);
      fetchProducts();
    } catch (err) {
      console.error(err);
      alert('An error occurred while saving the product.');
    }
  };

  const confirmDelete = async () => {
    if (deleteConfirmId !== null) {
      await apiFetch(`/api/products/${deleteConfirmId}`, { method: 'DELETE' });
      setDeleteConfirmId(null);
      fetchProducts();
    }
  };

  const openEditModal = (product: any) => {
    setEditingProduct(product);
    setFormData({
      code: product.code,
      name: product.name,
      category: product.category,
      unit: product.unit,
      price_ex_gst: product.price_ex_gst.toString(),
      gst_rate: product.gst_rate.toString(),
      hsn_code: product.hsn_code,
      stock: product.stock?.toString() || '0'
    });
    setIsModalOpen(true);
  };

  // Filter and Sort logic
  let filteredProducts = products.filter((p: any) => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || p.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  filteredProducts.sort((a: any, b: any) => {
    if (sortBy === 'name_asc') return a.name.localeCompare(b.name);
    if (sortBy === 'name_desc') return b.name.localeCompare(a.name);
    if (sortBy === 'price_asc') return a.price_ex_gst - b.price_ex_gst;
    if (sortBy === 'price_desc') return b.price_ex_gst - a.price_ex_gst;
    return 0;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-black tracking-tight text-white">Products Master</h1>
        <button
          onClick={() => {
            setEditingProduct(null);
            setFormData({ code: '', name: '', category: 'Fertilizer', unit: 'Bag', price_ex_gst: '', gst_rate: '5', hsn_code: '', stock: '0' });
            setIsModalOpen(true);
          }}
          className="inline-flex items-center px-6 py-3 border-2 border-zinc-950 text-sm font-bold rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-zinc-950 bg-lime-400 hover:bg-lime-300 hover:translate-y-[-2px] hover:translate-x-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all"
        >
          <Plus className="-ml-1 mr-2 h-5 w-5" />
          Add Product
        </button>
      </div>

      {/* Filters and Search */}
      <div className="bg-zinc-900 border-2 border-zinc-800 rounded-2xl p-4 flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative w-full sm:w-1/3">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-zinc-500" />
          </div>
          <input
            type="text"
            placeholder="Search by Code or Name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-10 sm:text-sm"
          />
        </div>
        
        <div className="flex gap-4 w-full sm:w-auto">
          <div className="flex items-center">
            <Filter className="h-5 w-5 text-zinc-500 mr-2" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="block w-full sm:text-sm"
            >
              <option value="All">All Categories</option>
              <option value="Fertilizer">Fertilizer</option>
              <option value="Pesticide">Pesticide</option>
              <option value="Seed">Seed</option>
              <option value="Herbicide">Herbicide</option>
              <option value="Micronutrient">Micronutrient</option>
            </select>
          </div>
          
          <div className="flex items-center">
            <ArrowUpDown className="h-5 w-5 text-zinc-500 mr-2" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="block w-full sm:text-sm"
            >
              <option value="name_asc">Name (A-Z)</option>
              <option value="name_desc">Name (Z-A)</option>
              <option value="price_asc">Price (Low to High)</option>
              <option value="price_desc">Price (High to Low)</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-zinc-900 border-2 border-zinc-800 overflow-hidden rounded-2xl">
        <table className="min-w-full divide-y divide-zinc-800">
          <thead className="bg-zinc-950/50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-bold text-zinc-400 uppercase tracking-wider">Code</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-zinc-400 uppercase tracking-wider">Name</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-zinc-400 uppercase tracking-wider">Category</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-zinc-400 uppercase tracking-wider">HSN</th>
              <th className="px-6 py-4 text-right text-xs font-bold text-zinc-400 uppercase tracking-wider">Price (ex GST)</th>
              <th className="px-6 py-4 text-right text-xs font-bold text-zinc-400 uppercase tracking-wider">GST %</th>
              <th className="px-6 py-4 text-right text-xs font-bold text-zinc-400 uppercase tracking-wider">Stock</th>
              <th className="px-6 py-4 text-right text-xs font-bold text-zinc-400 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-zinc-900 divide-y divide-zinc-800">
            {filteredProducts.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-zinc-500 font-medium">
                  No products found matching your criteria.
                </td>
              </tr>
            ) : (
              filteredProducts.map((product: any) => (
                <tr key={product.id} className="hover:bg-zinc-800/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-white">{product.code}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-zinc-300">{product.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-400">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-800 text-zinc-300 border border-zinc-700">
                      {product.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-zinc-500">{product.hsn_code}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-lime-400 text-right">₹{product.price_ex_gst.toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-400 text-right">{product.gst_rate}%</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold">
                    <span className={product.stock <= 10 ? 'text-rose-500' : 'text-zinc-300'}>
                      {product.stock} {product.unit}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => openEditModal(product)} className="text-cyan-400 hover:text-cyan-300 mr-4 transition-colors">
                      <Edit className="h-5 w-5" />
                    </button>
                    <button onClick={() => setDeleteConfirmId(product.id)} className="text-rose-500 hover:text-rose-400 transition-colors">
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId !== null && (
        <div className="fixed inset-0 z-[60] overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity z-0" aria-hidden="true" onClick={() => setDeleteConfirmId(null)}>
              <div className="absolute inset-0 bg-zinc-950 opacity-75 backdrop-blur-sm"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="relative z-10 inline-block align-bottom bg-zinc-900 border-2 border-zinc-800 rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-zinc-900 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-rose-500/10 sm:mx-0 sm:h-10 sm:w-10">
                    <Trash2 className="h-6 w-6 text-rose-500" aria-hidden="true" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-xl font-bold text-white">Delete Product</h3>
                    <div className="mt-2">
                      <p className="text-sm text-zinc-400">
                        Are you sure you want to delete this product? This action cannot be undone.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-zinc-950/50 px-4 py-4 sm:px-6 sm:flex sm:flex-row-reverse border-t border-zinc-800">
                <button type="button" onClick={confirmDelete} className="w-full inline-flex justify-center rounded-xl border-2 border-zinc-950 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] px-4 py-2 bg-rose-500 text-base font-bold text-zinc-950 hover:bg-rose-400 hover:translate-y-[-2px] hover:translate-x-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all sm:ml-3 sm:w-auto sm:text-sm">
                  Delete
                </button>
                <button type="button" onClick={() => setDeleteConfirmId(null)} className="mt-3 w-full inline-flex justify-center rounded-xl border-2 border-zinc-700 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] px-4 py-2 bg-zinc-800 text-base font-bold text-white hover:bg-zinc-700 hover:translate-y-[-2px] hover:translate-x-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity z-0" aria-hidden="true" onClick={() => setIsModalOpen(false)}>
              <div className="absolute inset-0 bg-zinc-950 opacity-75 backdrop-blur-sm"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="relative z-10 inline-block align-bottom bg-zinc-900 border-2 border-zinc-800 rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
              <form onSubmit={handleSubmit}>
                <div className="bg-zinc-900 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <h3 className="text-2xl font-black text-white mb-6">
                    {editingProduct ? 'Edit Product' : 'Add New Product'}
                  </h3>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-bold text-zinc-400 uppercase tracking-wider mb-2">Code/SKU</label>
                      <input type="text" required value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} className="block w-full sm:text-sm bg-zinc-950 border-2 border-zinc-800 rounded-lg p-2 text-white focus:ring-lime-400 focus:border-lime-400 outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-zinc-400 uppercase tracking-wider mb-2">HSN Code</label>
                      <input type="text" required value={formData.hsn_code} onChange={e => setFormData({...formData, hsn_code: e.target.value})} className="block w-full sm:text-sm bg-zinc-950 border-2 border-zinc-800 rounded-lg p-2 text-white focus:ring-lime-400 focus:border-lime-400 outline-none" />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-bold text-zinc-400 uppercase tracking-wider mb-2">Name</label>
                      <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="block w-full sm:text-sm bg-zinc-950 border-2 border-zinc-800 rounded-lg p-2 text-white focus:ring-lime-400 focus:border-lime-400 outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-zinc-400 uppercase tracking-wider mb-2">Category</label>
                      <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="block w-full sm:text-sm bg-zinc-950 border-2 border-zinc-800 rounded-lg p-2 text-white focus:ring-lime-400 focus:border-lime-400 outline-none">
                        <option>Fertilizer</option>
                        <option>Pesticide</option>
                        <option>Seed</option>
                        <option>Herbicide</option>
                        <option>Micronutrient</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-zinc-400 uppercase tracking-wider mb-2">Unit</label>
                      <select value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})} className="block w-full sm:text-sm bg-zinc-950 border-2 border-zinc-800 rounded-lg p-2 text-white focus:ring-lime-400 focus:border-lime-400 outline-none">
                        <option>Bag</option>
                        <option>Kg</option>
                        <option>Litre</option>
                        <option>Packet</option>
                        <option>Bottle</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-zinc-400 uppercase tracking-wider mb-2">Price (ex GST)</label>
                      <input type="number" step="0.01" required value={formData.price_ex_gst} onChange={e => setFormData({...formData, price_ex_gst: e.target.value})} className="block w-full sm:text-sm bg-zinc-950 border-2 border-zinc-800 rounded-lg p-2 text-white focus:ring-lime-400 focus:border-lime-400 outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-zinc-400 uppercase tracking-wider mb-2">GST Rate (%)</label>
                      <select value={formData.gst_rate} onChange={e => setFormData({...formData, gst_rate: e.target.value})} className="block w-full sm:text-sm bg-zinc-950 border-2 border-zinc-800 rounded-lg p-2 text-white focus:ring-lime-400 focus:border-lime-400 outline-none">
                        <option value="0">0%</option>
                        <option value="5">5%</option>
                        <option value="12">12%</option>
                        <option value="18">18%</option>
                        <option value="28">28%</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-zinc-400 uppercase tracking-wider mb-2">Stock Quantity</label>
                      <input type="number" step="0.01" required value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} className="block w-full sm:text-sm bg-zinc-950 border-2 border-zinc-800 rounded-lg p-2 text-white focus:ring-lime-400 focus:border-lime-400 outline-none" />
                    </div>
                  </div>
                </div>
                <div className="bg-zinc-950/50 px-4 py-4 sm:px-6 sm:flex sm:flex-row-reverse border-t border-zinc-800">
                  <button type="submit" className="w-full inline-flex justify-center rounded-xl border-2 border-zinc-950 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] px-6 py-2 bg-lime-400 text-base font-bold text-zinc-950 hover:bg-lime-300 hover:translate-y-[-2px] hover:translate-x-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all sm:ml-3 sm:w-auto sm:text-sm">
                    Save
                  </button>
                  <button type="button" onClick={() => setIsModalOpen(false)} className="mt-3 w-full inline-flex justify-center rounded-xl border-2 border-zinc-700 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] px-6 py-2 bg-zinc-800 text-base font-bold text-white hover:bg-zinc-700 hover:translate-y-[-2px] hover:translate-x-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
