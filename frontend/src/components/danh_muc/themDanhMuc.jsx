import React, { useState } from 'react';
import { themDanhMuc } from '../../api/danh_muc';
import './themDanhMuc.css'; 

export default function ThemDanhMuc({ onAdded }) {
  const [tenDanhMuc, setTenDanhMuc] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!tenDanhMuc.trim()) {
      alert('Tên danh mục không được để trống');
      return;
    }
    try {
      const res = await themDanhMuc(tenDanhMuc);
      alert(res.message); // 
      setTenDanhMuc('');
      if (onAdded) onAdded();
    } catch (error) {
      alert(error.message);
    }
  }

  return (
    <div className="adduser-section">
      <h2>Thêm Danh Mục</h2>
      <form onSubmit={handleSubmit} className="form-group">
        <label>
          Tên danh mục:
          <input
            type="text"
            className="input-field"
            value={tenDanhMuc}
            onChange={e => setTenDanhMuc(e.target.value)}
            placeholder="Tên danh mục"
          />
        </label>
        <button type="submit" className="add-user-button">Thêm danh mục</button>
      </form>
    </div>
  );
}
