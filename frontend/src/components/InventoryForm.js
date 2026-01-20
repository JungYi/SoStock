import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import api from '../services/api';
import { getUnits, getCategories } from '../services/meta';

const ADD_VALUE = '__add__';

export default function InventoryForm({ onAdd, onUpdate, editItem }) {
  // form states
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [brand, setBrand] = useState('');
  const [quantity, setQuantity] = useState(0);
  const [unit, setUnit] = useState('pcs');
  const [submitting, setSubmitting] = useState(false);

  // options
  const [units, setUnits] = useState([]);
  const [categories, setCategories] = useState([]);

  // inline “add new …”
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [showNewUnit, setShowNewUnit] = useState(false);
  const [newUnit, setNewUnit] = useState('');

  // A) 메타 로드 (마운트 1회)
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [u, c] = await Promise.all([getUnits(), getCategories()]);
        if (!mounted) return;
        setUnits(Array.isArray(u) ? u : []);
        setCategories(Array.isArray(c) ? c : []);
      } catch (e) {
        // 메타 실패해도 폼은 동작하게 (fallback은 services/meta에서 처리)
        // eslint-disable-next-line no-console
        console.error('meta load failed', e);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // B) editItem 주입 (수정/신규 전환 시 값 채우기)
  useEffect(() => {
    if (editItem && editItem._id) {
      setName(editItem.name || '');
      setCategory(editItem.category || '');
      setBrand(editItem.brand || '');
      setQuantity(Number(editItem.quantity ?? 0));
      setUnit(editItem.unit || 'pcs');

      // 옵션에 현재 값이 없으면 표시를 위해 추가
      setCategories((prev) => (editItem.category && !prev.includes(editItem.category)
        ? [...prev, editItem.category]
        : prev));
      setUnits((prev) => (editItem.unit && !prev.includes(editItem.unit)
        ? [...prev, editItem.unit]
        : prev));
      setShowNewCategory(false);
      setNewCategory('');
      setShowNewUnit(false);
      setNewUnit('');
    } else {
      // 신규 모드 초기화
      setName('');
      setCategory('');
      setBrand('');
      setQuantity(0);
      setUnit('pcs');
      setShowNewCategory(false);
      setNewCategory('');
      setShowNewUnit(false);
      setNewUnit('');
    }
  }, [editItem]);

  // C) 셀렉트 핸들러
  const handleCategorySelect = (val) => {
    if (val === ADD_VALUE) {
      setShowNewCategory(true);
      setNewCategory('');
      setCategory('');
      return;
    }
    setCategory(val);
    setShowNewCategory(false);
    setNewCategory('');
  };

  const handleUnitSelect = (val) => {
    if (val === ADD_VALUE) {
      setShowNewUnit(true);
      setNewUnit('');
      setUnit('');
      return;
    }
    setUnit(val);
    setShowNewUnit(false);
    setNewUnit('');
  };

  // D) 검증
  const validateFinal = (finalCategory, finalUnit) => {
    if (!name.trim()) return 'Name is required.';
    if (!finalCategory.trim()) return 'Category is required.';
    if (Number(quantity) < 0) return 'Quantity must be ≥ 0.';
    if (!finalUnit.trim()) return 'Unit is required.';
    return '';
  };

  // E) 제출
  const handleSubmit = async (e) => {
    e.preventDefault();

    // 인라인 입력 자동 확정
    let finalCategory = category;
    if (!finalCategory && showNewCategory && newCategory.trim()) {
      const v = newCategory.trim();
      if (!categories.includes(v)) setCategories((arr) => [...arr, v]);
      finalCategory = v;
    }
    let finalUnit = unit;
    if (!finalUnit && showNewUnit && newUnit.trim()) {
      const v = newUnit.trim();
      if (!units.includes(v)) setUnits((arr) => [...arr, v]);
      finalUnit = v;
    }

    const msg = validateFinal(finalCategory, finalUnit);
    if (msg) return toast.error(msg);

    try {
      setSubmitting(true);
      const payload = {
        name: name.trim(),
        category: finalCategory.trim(),
        brand: brand.trim(),
        quantity: Number(quantity),
        unit: finalUnit.trim(),
      };

      if (editItem?._id) {
        await api.put(`/inventory/${editItem._id}`, payload);
        toast.success('Item updated.');
        onUpdate?.();
      } else {
        await api.post('/inventory', payload);
        toast.success('Item added.');
        onAdd?.();
      }

      // 제출 후 인라인 상태 정리
      setShowNewCategory(false); setNewCategory('');
      setShowNewUnit(false); setNewUnit('');
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
      const m = err?.response?.data?.error || 'Failed to save item.';
      toast.error(m);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* 2-cols layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Name */}
        <div className="md:col-span-2">
          <label className="block text-sm mb-1">Name</label>
          <input
            className="input w-full"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        {/* Category */}
        <div className="md:col-span-2">
          <label className="block text-sm mb-1">Category</label>
          <select
            className="input w-full"
            value={category || (showNewCategory ? ADD_VALUE : '')}
            onChange={(e) => handleCategorySelect(e.target.value)}
          >
            <option value="">Select category…</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
            <option value={ADD_VALUE}>＋ Add new…</option>
          </select>

          {showNewCategory && (
            <div className="mt-2 flex items-center gap-2">
              <input
                className="input flex-1"
                placeholder="New category"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
              />
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  if (!newCategory.trim()) return toast.error('Enter a category name.');
                  const v = newCategory.trim();
                  if (!categories.includes(v)) setCategories((arr) => [...arr, v]);
                  setCategory(v);
                  setShowNewCategory(false);
                  setNewCategory('');
                  toast.success('Category added.');
                }}
              >
                Add
              </button>
              <button
                type="button"
                className="btn btn-muted"
                onClick={() => { setShowNewCategory(false); setNewCategory(''); }}
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        {/* Brand */}
        <div className="md:col-span-2">
          <label className="block text-sm mb-1">Brand (optional)</label>
          <input
            className="input w-full"
            placeholder="Brand"
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
          />
        </div>

        {/* Qty & Unit */}
        <div>
          <label className="block text-sm mb-1">Qty</label>
          <input
            type="number"
            min="0"
            step="1"
            className="input w-full"
            placeholder="0"
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Unit</label>
          <select
            className="input w-full"
            value={unit || (showNewUnit ? ADD_VALUE : '')}
            onChange={(e) => handleUnitSelect(e.target.value)}
          >
            <option value="">Select unit…</option>
            {units.map((u) => (
              <option key={u} value={u}>{u}</option>
            ))}
            <option value={ADD_VALUE}>＋ Add new…</option>
          </select>

          {showNewUnit && (
            <div className="mt-2 flex items-center gap-2">
              <input
                className="input flex-1"
                placeholder="New unit (e.g., bottle)"
                value={newUnit}
                onChange={(e) => setNewUnit(e.target.value)}
              />
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  if (!newUnit.trim()) return toast.error('Enter a unit.');
                  const v = newUnit.trim();
                  if (!units.includes(v)) setUnits((arr) => [...arr, v]);
                  setUnit(v);
                  setShowNewUnit(false);
                  setNewUnit('');
                  toast.success('Unit added.');
                }}
              >
                Add
              </button>
              <button
                type="button"
                className="btn btn-muted"
                onClick={() => { setShowNewUnit(false); setNewUnit(''); }}
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end">
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Saving…' : (editItem ? 'Update' : 'Add')}
        </button>
      </div>
    </form>
  );
}