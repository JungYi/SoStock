import { useState, useEffect, useMemo } from 'react';
import api from '../services/api';

const VALID_UNITS = ['pcs','kg','g','ml','l','pack'];
const DEFAULT = { name: '', category: '', quantity: '', unit: 'pcs' };

const sanitize = (v) => v.replace(/\s+/g, ' ').trim();

const validate = (form) => {
  const errors = {};
  const name = sanitize(form.name || '');
  const category = sanitize(form.category || '');
  const qtyNum = Number(form.quantity);

  if (!name) errors.name = 'Name is required.';
  // 스펙 통일: 1 미만 금지
  if (form.quantity === '' || Number.isNaN(qtyNum)) {
    errors.quantity = 'Quantity is required.';
  } else if (qtyNum < 1) {
    errors.quantity = 'Quantity must be ≥ 1.';
  }

  if (!VALID_UNITS.includes(form.unit)) {
    errors.unit = 'Invalid unit.';
  }

  if (!category) errors.category = 'Category is required.';

  return errors;
};

const InventoryForm = ({ onAdd, editItem, onUpdate }) => {
  const [form, setForm] = useState(DEFAULT);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (editItem) {
      const { name, category, quantity, unit } = editItem;
      setForm({
        name: name ?? '',
        category: category ?? '',
        quantity: String(quantity ?? ''),
        unit: VALID_UNITS.includes(unit) ? unit : 'pcs',
      });
      setErrors({});
      setTouched({});
    } else {
      setForm(DEFAULT);
      setErrors({});
      setTouched({});
    }
  }, [editItem]);

  // 실시간 검증: 변경 시마다 에러 재계산
  const currentErrors = useMemo(() => validate(form), [form]);
  const isValid = useMemo(() => Object.keys(currentErrors).length === 0, [currentErrors]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: name === 'name' || name === 'category' ? value : value }));
  };

  const onBlur = (e) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    // 최종 검증
    setTouched({ name: true, category: true, quantity: true, unit: true });
    const finalErrors = validate(form);
    setErrors(finalErrors);
    if (Object.keys(finalErrors).length) return;

    setSubmitting(true);
    try {
      const payload = {
        name: sanitize(form.name),
        category: sanitize(form.category),
        quantity: Number(form.quantity),
        unit: form.unit,
      };

      if (editItem) {
        await api.put(`/inventory/${editItem._id}`, payload);
        onUpdate?.();
      } else {
        await api.post('/inventory', payload);
        onAdd?.();
      }
      setForm(DEFAULT);
      setTouched({});
    } catch (err) {
      const serverMsg = err?.response?.data?.error || 'Failed to save item.';
      // TODO: replace with toast
      window.alert(serverMsg);
    } finally {
      setSubmitting(false);
    }
  };

  // 표시할 에러: touched 된 필드만 노출 (실시간이지만 거슬리지 않게)
  const showError = (field) => (touched[field] ? (errors[field] || currentErrors[field]) : null);

  return (
    <form onSubmit={onSubmit} className="space-y-3" noValidate>
      <h2 className="text-xl font-semibold">{editItem ? 'Edit Inventory Item' : 'Add Inventory Item'}</h2>

      <div>
        <input
          name="name"
          value={form.name}
          onChange={onChange}
          onBlur={onBlur}
          placeholder="Name"
          className="border px-2 py-1 w-full"
          aria-invalid={!!showError('name')}
          aria-describedby="name-error"
        />
        {showError('name') && <p id="name-error" className="text-red-600 text-sm mt-1">{showError('name')}</p>}
      </div>

      <div>
        <input
          name="category"
          value={form.category}
          onChange={onChange}
          onBlur={onBlur}
          placeholder="Category"
          className="border px-2 py-1 w-full"
          aria-invalid={!!showError('category')}
          aria-describedby="category-error"
        />
        {showError('category') && <p id="category-error" className="text-red-600 text-sm mt-1">{showError('category')}</p>}
      </div>

      <div>
        <input
          name="quantity"
          value={form.quantity}
          onChange={onChange}
          onBlur={onBlur}
          type="number"
          placeholder="Quantity"
          className="border px-2 py-1 w-full"
          min={1}
          step="1"
          inputMode="numeric"
          aria-invalid={!!showError('quantity')}
          aria-describedby="quantity-error"
        />
        {showError('quantity') && <p id="quantity-error" className="text-red-600 text-sm mt-1">{showError('quantity')}</p>}
      </div>

      <div>
        <select
          name="unit"
          value={form.unit}
          onChange={onChange}
          onBlur={onBlur}
          className="border px-2 py-1 w-full"
          aria-invalid={!!showError('unit')}
          aria-describedby="unit-error"
        >
          {VALID_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
        </select>
        {showError('unit') && <p id="unit-error" className="text-red-600 text-sm mt-1">{showError('unit')}</p>}
      </div>

      <button
        type="submit"
        disabled={submitting || !isValid}
        className="bg-black text-white px-4 py-2 rounded disabled:opacity-60"
      >
        {editItem ? 'Update' : 'Add'}
      </button>
    </form>
  );
};

export default InventoryForm;