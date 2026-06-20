import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Pencil, X } from 'lucide-react';
import { useCompanies, useCreateCompany, useUpdateCompany, useDeleteCompany } from '@/hooks/useCompanies';
import type { Company } from '@/services/api/companyApi';
import { companySchema, slugify, type CompanyFormInput } from '@/schemas/company';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { toast } from '@/components/ui/Toast';

export function CompaniesPage() {
  const { data: companies = [], isLoading, isError, refetch } = useCompanies();
  const createCompany = useCreateCompany();
  const updateCompany = useUpdateCompany();
  const deleteCompany = useDeleteCompany();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CompanyFormInput>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      name: '',
      slug: '',
      description: '',
      website: '',
      industry: '',
      size: '',
      logoUrl: '',
    },
  });

  const nameValue = watch('name');
  const slugValue = watch('slug');

  useEffect(() => {
    if (!slugManuallyEdited && nameValue && !editingCompany) {
      setValue('slug', slugify(nameValue), { shouldValidate: false });
    }
  }, [nameValue, slugManuallyEdited, editingCompany, setValue]);

  useEffect(() => {
    if (slugValue && editingCompany) {
      setSlugManuallyEdited(true);
    }
  }, [slugValue, editingCompany]);

  const handleEdit = (company: Company) => {
    setEditingCompany(company);
    setSlugManuallyEdited(true);
    reset({
      name: company.name,
      slug: company.slug || '',
      description: company.description || '',
      website: company.website || '',
      industry: company.industry || '',
      size: company.size || '',
      logoUrl: company.logoUrl || '',
    });
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setEditingCompany(null);
    setSlugManuallyEdited(false);
    reset({
      name: '',
      slug: '',
      description: '',
      website: '',
      industry: '',
      size: '',
      logoUrl: '',
    });
    setIsModalOpen(true);
  };

  const handleClose = () => {
    setIsModalOpen(false);
    setEditingCompany(null);
    setSlugManuallyEdited(false);
  };

  const onSubmit = handleSubmit(async (data) => {
    const payload = {
      ...data,
      website: data.website || undefined,
      logoUrl: data.logoUrl || undefined,
      description: data.description || undefined,
      industry: data.industry || undefined,
      size: data.size || undefined,
    };

    try {
      if (editingCompany) {
        await updateCompany.mutateAsync({ id: editingCompany.id, data: payload as CompanyFormInput });
        toast.success('Empresa atualizada com sucesso');
      } else {
        await createCompany.mutateAsync(payload);
        toast.success('Empresa criada com sucesso');
      }
      handleClose();
    } catch {
      toast.error('Erro ao salvar empresa. Tente novamente.');
    }
  });

  const confirmDelete = () => {
    if (pendingDeleteId === null) return;
    deleteCompany.mutate(pendingDeleteId, {
      onSuccess: () => {
        toast.success('Empresa excluída com sucesso');
        setPendingDeleteId(null);
      },
      onError: () => {
        toast.error('Erro ao excluir empresa.');
        setPendingDeleteId(null);
      },
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Empresas</h1>
        <Button onClick={handleCreate}>
          <Plus className="w-4 h-4" />
          Nova Empresa
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : isError ? (
            <EmptyState
              title="Erro ao carregar empresas"
              description="Não foi possível obter a lista de empresas."
              action={<Button onClick={() => refetch()}>Tentar novamente</Button>}
            />
          ) : companies.length === 0 ? (
            <EmptyState
              title="Nenhuma empresa encontrada"
              description="Cadastre a primeira empresa para começar."
              action={<Button onClick={handleCreate}><Plus className="w-4 h-4" />Nova Empresa</Button>}
            />
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Nome</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Indústria</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Tamanho</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Website</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Ações</th>
                </tr>
              </thead>
              <tbody>
                {companies.map((company) => (
                  <tr key={company.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{company.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{company.industry || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{company.size || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {company.website ? (
                        <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-[#2B5FC2] hover:underline">
                          {company.website}
                        </a>
                      ) : '-'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(company)}
                          className="p-1.5 text-gray-500 hover:text-[#2B5FC2] hover:bg-blue-50 rounded transition-colors"
                          title="Editar"
                          aria-label="Editar empresa"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setPendingDeleteId(company.id)}
                          className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Excluir"
                          aria-label="Excluir empresa"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={handleClose}
        title={editingCompany ? 'Editar Empresa' : 'Nova Empresa'}
        size="md"
      >
        <form onSubmit={onSubmit} className="space-y-4">
          <Input
            label="Nome"
            {...register('name')}
            error={errors.name?.message}
            placeholder="Nome da empresa"
          />
          <Input
            label="Slug"
            {...register('slug', {
              onChange: () => setSlugManuallyEdited(true),
            })}
            error={errors.slug?.message}
            placeholder="slug-da-empresa"
            hint="Gerado automaticamente a partir do nome. Edite apenas se necessário."
          />
          <Textarea
            label="Descrição"
            {...register('description')}
            error={errors.description?.message}
            rows={3}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Website"
              type="url"
              {...register('website')}
              error={errors.website?.message}
              placeholder="https://"
            />
            <Input
              label="Logo URL"
              type="url"
              {...register('logoUrl')}
              error={errors.logoUrl?.message}
              placeholder="https://"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Indústria"
              {...register('industry')}
              error={errors.industry?.message}
            />
            <Input
              label="Tamanho"
              {...register('size')}
              error={errors.size?.message}
              placeholder="ex: 50-100"
            />
          </div>
          <div className="flex items-center justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit" loading={isSubmitting || createCompany.isPending || updateCompany.isPending}>
              Salvar
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={pendingDeleteId !== null}
        onClose={() => setPendingDeleteId(null)}
        onConfirm={confirmDelete}
        title="Excluir empresa"
        message="Tem certeza que deseja excluir esta empresa? Esta ação não pode ser desfeita."
        confirmText="Excluir"
        variant="danger"
        loading={deleteCompany.isPending}
      />
    </div>
  );
}
