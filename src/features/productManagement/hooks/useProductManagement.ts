import { useState, useEffect, useMemo } from 'react';
import {
  getProductMasters,
  createProductMaster,
  updateProductMaster,
  deleteProductMaster,
} from '@/firebase/services/productMasterService';
import type { ProductMaster, ProductType } from '@/types';

export function useProductManagement() {
  const [products, setProducts] = useState<ProductMaster[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filterType, setFilterType] = useState<string>('all');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<{ name: string; type: ProductType }>({
    name: '',
    type: 'General',
  });

  const [isAdding, setIsAdding] = useState(false);
  const [newData, setNewData] = useState<{ name: string; type: ProductType }>({
    name: '',
    type: 'General',
  });

  const [isSaving, setIsSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<ProductMaster | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const productsData = await getProductMasters();
      setProducts(productsData);
      setError(null);
    } catch (err) {
      setError('데이터를 불러오는데 실패했습니다.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (filterType !== 'all' && p.type !== filterType) return false;
      return true;
    });
  }, [products, filterType]);

  const handleAdd = async () => {
    if (!newData.name.trim()) return;
    try {
      setIsSaving(true);
      await createProductMaster({
        name: newData.name.trim(),
        type: newData.type,
      });
      setNewData({ name: '', type: 'General' });
      setIsAdding(false);
      await loadData();
    } catch (err) {
      setError('제품 추가에 실패했습니다.');
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (product: ProductMaster) => {
    setEditingId(product.id);
    setEditData({ name: product.name, type: product.type });
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editData.name.trim()) return;
    try {
      setIsSaving(true);
      await updateProductMaster(editingId, {
        name: editData.name.trim(),
        type: editData.type,
      });
      setEditingId(null);
      await loadData();
    } catch (err) {
      setError('제품 수정에 실패했습니다.');
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditData({ name: '', type: 'General' });
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      await deleteProductMaster(deleteTarget.id);
      setDeleteTarget(null);
      await loadData();
    } catch (err) {
      setError('제품 삭제에 실패했습니다.');
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  const cancelAdd = () => {
    setIsAdding(false);
    setNewData({ name: '', type: 'General' });
  };

  return {
    products,
    filteredProducts,
    isLoading,
    error,
    setError,
    filterType,
    setFilterType,
    editingId,
    editData,
    setEditData,
    isAdding,
    setIsAdding,
    newData,
    setNewData,
    isSaving,
    deleteTarget,
    setDeleteTarget,
    isDeleting,
    handleAdd,
    handleEdit,
    handleSaveEdit,
    handleCancelEdit,
    handleConfirmDelete,
    cancelAdd,
  };
}
