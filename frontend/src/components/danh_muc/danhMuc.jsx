import React, { useEffect, useState } from "react";
import {
  fetchDanhSachDanhMuc,
  suaDanhMuc,
  xoaDanhMuc,
} from "../../api/danh_muc";
import { getDoUongTheoDanhMuc, suaDoUong, xoaDoUong } from "../../api/doUong";
import "./danhMuc.css";

export default function QuanLyDanhMucVaDoUong() {
  const [danhMuc, setDanhMuc] = useState([]);
  const [doUong, setDoUong] = useState([]);
  const [danhMucChon, setDanhMucChon] = useState(null);

  // State sửa danh mục
  const [editingId, setEditingId] = useState(null);
  const [tenMoi, setTenMoi] = useState("");

  // State sửa đồ uống
  const [editingDoUongId, setEditingDoUongId] = useState(null);
  const [doUongMoi, setDoUongMoi] = useState({
    ten_do_uong: "",
    gia: "",
    giam_gia_phan_tram: "",
    mo_ta: "",
    hien_thi: true,
    hinh_anh: null,
  });
  const [imagePreview, setImagePreview] = useState(null); // New state for image preview

  // Load danh mục
  useEffect(() => {
    loadDanhMuc();
  }, []);

  // Load đồ uống khi danh mục chọn thay đổi
  useEffect(() => {
    if (danhMucChon === null) {
      setDoUong([]);
      return;
    }
    getDoUongTheoDanhMuc(danhMucChon)
      .then((ds) => setDoUong(ds))
      .catch((err) => alert("Lỗi lấy đồ uống: " + err.message));
  }, [danhMucChon]);

  async function loadDanhMuc() {
    try {
      const res = await fetchDanhSachDanhMuc();
      setDanhMuc(res.data);
      if (!danhMucChon && res.data.length > 0) {
        setDanhMucChon(res.data[0].ma_danh_muc);
      }
    } catch (error) {
      alert(error.message);
    }
  }

  // Sửa danh mục
  async function handleSuaDanhMuc(maDanhMuc) {
    if (!tenMoi.trim()) {
      alert("Tên danh mục không được để trống");
      return;
    }
    try {
      const res = await suaDanhMuc(maDanhMuc, tenMoi);
      alert(res.message);
      setEditingId(null);
      setTenMoi("");
      loadDanhMuc();
    } catch (error) {
      alert(error.message);
    }
  }

  // Xóa danh mục
  async function handleXoaDanhMuc(maDanhMuc) {
    if (!window.confirm("Bạn có chắc muốn xóa danh mục này?")) return;
    try {
      const res = await xoaDanhMuc(maDanhMuc);
      alert(res.message);
      if (maDanhMuc === danhMucChon) setDanhMucChon(null);
      loadDanhMuc();
    } catch (error) {
      alert(error.message);
    }
  }

  // Bắt đầu sửa đồ uống: fill dữ liệu vào form sửa
  function handleEditDoUong(doUong) {
    setEditingDoUongId(doUong.ma_do_uong);
    setDoUongMoi({
      ten_do_uong: doUong.ten_do_uong,
      gia: doUong.gia,
      giam_gia_phan_tram: doUong.giam_gia_phan_tram,
      mo_ta: doUong.mo_ta,
      hien_thi: doUong.hien_thi,
      hinh_anh: null,
    });
    setImagePreview(
      doUong.hinh_anh
        ? `http://localhost:5000/uploads/hinh_anh/${doUong.hinh_anh}`
        : null
    ); // Set existing image preview
  }

  // Hủy sửa đồ uống
  function handleCancelEditDoUong() {
    setEditingDoUongId(null);
    setDoUongMoi({
      ten_do_uong: "",
      gia: "",
      giam_gia_phan_tram: "",
      mo_ta: "",
      hien_thi: true,
      hinh_anh: null,
    });
    setImagePreview(null); // Clear preview on cancel
  }

  // Xử lý khi chọn file ảnh mới
  function handleChangeFile(e) {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result); // Set preview URL
        setDoUongMoi((prev) => ({ ...prev, hinh_anh: file || null }));
      };
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
      setDoUongMoi((prev) => ({ ...prev, hinh_anh: null }));
    }
  }

  // Lưu sửa đồ uống (gửi formData)
  async function handleSaveDoUong(maDoUong) {
    if (!doUongMoi.ten_do_uong.trim()) {
      alert("Tên đồ uống không được để trống");
      return;
    }
    if (isNaN(doUongMoi.gia) || doUongMoi.gia <= 0) {
      alert("Giá phải là số lớn hơn 0");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("ten_do_uong", doUongMoi.ten_do_uong);
      formData.append("gia", doUongMoi.gia);
      formData.append("giam_gia_phan_tram", doUongMoi.giam_gia_phan_tram || 0);
      formData.append("mo_ta", doUongMoi.mo_ta);
      formData.append("hien_thi", doUongMoi.hien_thi ? "1" : "0");
      if (doUongMoi.hinh_anh) {
        formData.append("hinh_anh", doUongMoi.hinh_anh);
      }

      const res = await suaDoUong(maDoUong, formData);
      alert(res.message);
      setEditingDoUongId(null);
      setImagePreview(null); // Clear preview after save

      // Reload đồ uống
      const ds = await getDoUongTheoDanhMuc(danhMucChon);
      setDoUong(ds);
    } catch (error) {
      alert(error.message);
    }
  }

  // Xóa đồ uống
  async function handleDeleteDoUong(maDoUong) {
    if (!window.confirm("Bạn có chắc muốn xóa đồ uống này?")) return;
    try {
      const res = await xoaDoUong(maDoUong);
      alert(res.message);
      // Reload đồ uống
      const ds = await getDoUongTheoDanhMuc(danhMucChon);
      setDoUong(ds);
    } catch (error) {
      alert(error.message);
    }
  }

  return (
    <div className="container">
      {/* Danh mục */}
      <div className="category-section">
        <h2 className="section-title">Danh sách danh mục</h2>
        <ul className="category-list">
          {danhMuc.map((dm) => (
            <li
              key={dm.ma_danh_muc}
              className={`category-item ${
                danhMucChon === dm.ma_danh_muc ? "active" : ""
              }`}
              onClick={() => setDanhMucChon(dm.ma_danh_muc)}
            >
              <div className="category-content">
                {editingId === dm.ma_danh_muc ? (
                  <div className="edit-form">
                    <input
                      type="text"
                      className="edit-input"
                      value={tenMoi}
                      onChange={(e) => setTenMoi(e.target.value)}
                      placeholder="Tên danh mục mới"
                    />
                    <button
                      className="btn-save"
                      onClick={() => handleSuaDanhMuc(dm.ma_danh_muc)}
                    >
                      Lưu
                    </button>
                    <button
                      className="btn-cancel"
                      onClick={() => {
                        setEditingId(null);
                        setTenMoi("");
                      }}
                    >
                      Hủy
                    </button>
                  </div>
                ) : (
                  <>
                    <span className="category-name">{dm.ten_danh_muc}</span>
                    <div className="category-actions">
                      <button
                        className="btn-edit"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingId(dm.ma_danh_muc);
                          setTenMoi(dm.ten_danh_muc);
                        }}
                      >
                        Sửa
                      </button>
                      <button
                        className="btn-delete"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleXoaDanhMuc(dm.ma_danh_muc);
                        }}
                      >
                        Xóa
                      </button>
                    </div>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Đồ uống */}
      <div className="drinks-section">
        <h2 className="drinks-title">
          Đồ uống trong danh mục:{" "}
          {danhMuc.find((dm) => dm.ma_danh_muc === danhMucChon)?.ten_danh_muc ||
            "Chưa chọn"}
        </h2>
        {!danhMucChon && <p>Vui lòng chọn danh mục bên trái để xem đồ uống.</p>}

        <ul className="drinks-list">
          {doUong.map((d) => (
            <li key={d.ma_do_uong} className="drink-item">
              {editingDoUongId === d.ma_do_uong ? (
                <div className="drink-edit-form">
                  <div className="form-group">
                    <label>Tên đồ uống</label>
                    <input
                      type="text"
                      value={doUongMoi.ten_do_uong}
                      onChange={(e) =>
                        setDoUongMoi({
                          ...doUongMoi,
                          ten_do_uong: e.target.value,
                        })
                      }
                      placeholder="Tên đồ uống"
                    />
                  </div>
                  <div className="form-group">
                    <label>Giá (VNĐ)</label>
                    <input
                      type="number"
                      value={doUongMoi.gia}
                      onChange={(e) =>
                        setDoUongMoi({ ...doUongMoi, gia: e.target.value })
                      }
                      placeholder="Giá"
                    />
                  </div>
                  <div className="form-group">
                    <label>Giảm giá (%)</label>
                    <input
                      type="number"
                      value={doUongMoi.giam_gia_phan_tram}
                      onChange={(e) =>
                        setDoUongMoi({
                          ...doUongMoi,
                          giam_gia_phan_tram: e.target.value,
                        })
                      }
                      placeholder="Giảm giá %"
                      min="0"
                      max="100"
                    />
                  </div>
                  <div className="form-group">
                    <label>Mô tả</label>
                    <textarea
                      value={doUongMoi.mo_ta}
                      onChange={(e) =>
                        setDoUongMoi({ ...doUongMoi, mo_ta: e.target.value })
                      }
                      placeholder="Mô tả"
                    />
                  </div>
                  <div className="form-group">
                    <label>
                      <input
                        type="checkbox"
                        checked={doUongMoi.hien_thi}
                        onChange={(e) =>
                          setDoUongMoi({
                            ...doUongMoi,
                            hien_thi: e.target.checked,
                          })
                        }
                      />{" "}
                      Hiện thị sản phẩm
                    </label>
                  </div>
                  <div className="form-group">
                    <label>Hình ảnh mới</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleChangeFile}
                    />
                    {imagePreview && (
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="image-preview"
                      />
                    )}
                  </div>
                  <div className="form-actions">
                    <button
                      className="btn-save"
                      onClick={() => handleSaveDoUong(d.ma_do_uong)}
                    >
                      Lưu thay đổi
                    </button>
                    <button
                      className="btn-cancel"
                      onClick={handleCancelEditDoUong}
                    >
                      Hủy bỏ
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <h3 className="drink-name">{d.ten_do_uong}</h3>
                  <div className="drink-info">
                    <div className="drink-details">
                      <div className="price-info">
                        <span className="price-original">
                          Giá: {Number(d.gia).toLocaleString()} VNĐ
                        </span>
                      </div>
                      <div className="price-info">
                        <span className="price-discount">
                          Giảm giá: {d.giam_gia_phan_tram || 0}%
                        </span>
                      </div>
                      <div className="price-info">
                        <span className="price-final">
                          Giá bán:{" "}
                          {(
                            d.gia *
                            (1 - (d.giam_gia_phan_tram || 0) / 100)
                          ).toLocaleString()}{" "}
                          VNĐ
                        </span>
                      </div>
                      <div className="drink-description">Mô tả: {d.mo_ta}</div>
                      <span className="drink-status">
                        Hiển thị: {d.hien_thi ? "Có" : "Không"}
                      </span>
                    </div>
                    {d.hinh_anh && (
                      <img
                        src={`http://localhost:5000/uploads/hinh_anh/${d.hinh_anh}`}
                        alt={d.ten_do_uong}
                        className="drink-image"
                      />
                    )}
                  </div>
                  <div className="drink-actions">
                    <button
                      className="btn-edit"
                      onClick={() => handleEditDoUong(d)}
                    >
                      Sửa
                    </button>
                    <button
                      className="btn-delete"
                      onClick={() => handleDeleteDoUong(d.ma_do_uong)}
                    >
                      Xóa
                    </button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
