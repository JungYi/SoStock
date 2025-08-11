import { useState, useEffect, useMemo, useRef } from 'react';
import api from '../services/api';

const VALID_UNITS = ['pcs', 'kg', 'g', 'ml', 'l', 'pack'];
const DEFAULT = { name: '', category: '', quantity: '', unit: 'pcs' };

const sanitize = (v = '') => v.replace(/\s+/g, ' ').trim();

const validate = (form) => {
  const errors = {};
  const name = sanitize(form.name);
  const category = sanitize(form.category);
  const qtyNum = Number(form.quantity);

  if (!name) errors.name = 'Name is required.';
  if (form.quantity === '' || Number.isNaN(qtyNum)) {
    errors.quantity = 'Quantity is required.';
  } else if (qtyNum < 1) {
    errors.quantity = 'Quantity must be ≥ 1.';
  }
  if (!VALID_UNITS.includes(form.unit)) errors.unit = 'Invalid unit.';

  if (!category) errors.category = 'Category is required.';

  return errors;
};

const InventoryForm = ({ onAdd, editItem, onUpdate }) => {
  const [form, setForm] = useState(DEFAULT);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // refs for first-error focus
  const nameRef = useRef(null);
  const categoryRef = useRef(null);
  const quantityRef = useRef(null);
  const unitRef = useRef(null);

  useEffect(() => {
    if (editItem) {
      const { name, category, quantity, unit } = editItem;
      setForm({
        name: name || '',
        category: category || '',
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

  const currentErrors = useMemo(() => validate(form), [form]);

  const showError = (field) =>
    touched[field] ? (errors[field] || currentErrors[field]) : null;

  const inputCls = (field) =>
    `border px-2 py-1 w-full ${
      showError(field) ? 'border-red-600' : 'border-gray-300'
    }`;

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onBlur = (e) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
  };

  const focusFirstError = (errs) => {
    const order = ['name', 'category', 'quantity', 'unit'];
    const first = order.find((f) => errs[f]);
    if (!first) return;
    const map = {
      name: nameRef,
      category: categoryRef,
      quantity: quantityRef,
      unit: unitRef,
    };
    map[first]?.current?.focus();
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    // 모든 필드를 touched 처리 후 최종 검증
    setTouched({ name: true, category: true, quantity: true, unit: true });
    const finalErrors = validate(form);
    setErrors(finalErrors);
    if (Object.keys(finalErrors).length) {
      focusFirstError(finalErrors);
      return;
    }

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
      alert(serverMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-3" noValidate>
      <h2 className="text-xl font-semibold">
        {editItem ? 'Edit Inventory Item' : 'Add Inventory Item'}
      </h2>

      <div>
        <input
          ref={nameRef}
          name="name"
          value={form.name}
          onChange={onChange}
          onBlur={onBlur}
          placeholder="Name"
          className={inputCls('name')}
          aria-invalid={!!showError('name')}
          aria-describedby="name-error"
        />
        {showError('name') && (
          <p id="name-error" className="text-red-600 text-sm mt-1">
            {showError('name')}
          </p>
        )}
      </div>

      <div>
        <input
          ref={categoryRef}
          name="category"
          value={form.category}
          onChange={onChange}
          onBlur={onBlur}
          placeholder="Category"
          className={inputCls('category')}
          aria-invalid={!!showError('category')}
          aria-describedby="category-error"
        />
        {showError('category') && (
          <p id="category-error" className="text-red-600 text-sm mt-1">
            {showError('category')}
          </p>
        )}
      </div>

      <div>
        <input
          ref={quantityRef}
          name="quantity"
          value={form.quantity}
          onChange={onChange}
          onBlur={onBlur}
          type="number"
          placeholder="Quantity"
          className={inputCls('quantity')}
          min={1}
          step="1"
          inputMode="numeric"
          aria-invalid={!!showError('quantity')}
          aria-describedby="quantity-error"
        />
        {showError('quantity') && (
          <p id="quantity-error" className="text-red-600 text-sm mt-1">
            {showError('quantity')}
          </p>
        )}
      </div>

      <div>
        <select
          ref={unitRef}
          name="unit"
          value={form.unit}
          onChange={onChange}
          onBlur={onBlur}
          className={inputCls('unit')}
          aria-invalid={!!showError('unit')}
          aria-describedby="unit-error"
        >
          {VALID_UNITS.map((u) => (
            <option key={u} value={u}>
              {u}
            </option>
          ))}
        </select>
        {showError('unit') && (
          <p id="unit-error" className="text-red-600 text-sm mt-1">
            {showError('unit')}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="bg-black text-white px-4 py-2 rounded disabled:opacity-60"
      >
        {editItem ? 'Update' : 'Add'}
      </button>
    </form>
  );
};

export default InventoryForm;