import { useEffect, useState } from 'react'
import { Plus, Pencil, X } from 'lucide-react'
import * as companyApi from '../services/api/companyApi'
import type { Company, CompanyInput } from '../services/api/companyApi'

export function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCompany, setEditingCompany] = useState<Company | null>(null)
  const [formData, setFormData] = useState<Partial<CompanyInput>>({})

  const loadCompanies = async () => {
    setLoading(true)
    try {
      const data = await companyApi.getAll()
      setCompanies(data)
    } catch (error) {
      console.error('Failed to load companies:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCompanies()
  }, [])

  const handleEdit = (company: Company) => {
    setEditingCompany(company)
    setFormData({
      name: company.name,
      description: company.description,
      website: company.website,
      logoUrl: company.logoUrl,
      industry: company.industry,
      size: company.size,
      location: company.location,
    })
    setIsModalOpen(true)
  }

  const handleCreate = () => {
    setEditingCompany(null)
    setFormData({
      name: '',
      description: '',
      website: '',
      logoUrl: '',
      industry: '',
      size: '',
      location: '',
    })
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingCompany) {
        await companyApi.update(editingCompany.id, formData)
      } else {
        await companyApi.create(formData as CompanyInput)
      }
      setIsModalOpen(false)
      await loadCompanies()
    } catch (error) {
      console.error('Failed to save company:', error)
      alert('Erro ao salvar empresa. Tente novamente.')
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Empresas</h1>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2 bg-[#2B5FC2] text-white rounded-lg hover:bg-[#234D9E] transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Nova Empresa
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Nome</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Indústria</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Localização</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Website</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">Carregando...</td>
                </tr>
              ) : companies.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">Nenhuma empresa encontrada</td>
                </tr>
              ) : (
                companies.map((company) => (
                  <tr key={company.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{company.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{company.industry || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{company.location || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {company.website ? (
                        <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-[#2B5FC2] hover:underline">
                          {company.website}
                        </a>
                      ) : '-'}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleEdit(company)}
                        className="p-1.5 text-gray-500 hover:text-[#2B5FC2] hover:bg-blue-50 rounded transition-colors"
                        title="Editar"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingCompany ? 'Editar Empresa' : 'Nova Empresa'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B5FC2] focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B5FC2] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                <input
                  type="url"
                  value={formData.website || ''}
                  onChange={(e) => setFormData((prev) => ({ ...prev, website: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B5FC2] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Logo URL</label>
                <input
                  type="url"
                  value={formData.logoUrl || ''}
                  onChange={(e) => setFormData((prev) => ({ ...prev, logoUrl: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B5FC2] focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Indústria</label>
                  <input
                    type="text"
                    value={formData.industry || ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, industry: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B5FC2] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tamanho</label>
                  <input
                    type="text"
                    value={formData.size || ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, size: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B5FC2] focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Localização</label>
                <input
                  type="text"
                  value={formData.location || ''}
                  onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B5FC2] focus:border-transparent"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-[#2B5FC2] rounded-lg hover:bg-[#234D9E] transition-colors"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
