import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../../components/gio_hang/cartContext";
import { getGioHangByUser } from "../../api/gioHang";
import { createDonHang } from "../../api/donHang";
import { initSocket, disconnectSocket } from "../../socket";
import "./orderForm.css";

const OrderForm = () => {
  const { fetchCart } = useCart();
  const navigate = useNavigate();
  const maNguoiDung = localStorage.getItem("ma_nguoi_dung");
  const token = localStorage.getItem("token");

  const [gioHang, setGioHang] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [orderInfo, setOrderInfo] = useState({
    ten_khach: "",
    dia_chi_khach: "",
    sdt_khach: "",
    phuong_thuc_thanh_toan: "tien_mat",
  });
  const [tempChiTiet, setTempChiTiet] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      if (!maNguoiDung || !token) {
        setError("Vui lòng đăng nhập để đặt hàng");
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const hoTen = localStorage.getItem("ho_ten") || "";
        const diaChi = localStorage.getItem("dia_chi") || "";
        const soDienThoai = localStorage.getItem("so_dien_thoai") || "";
        setOrderInfo({
          ten_khach: hoTen,
          dia_chi_khach: diaChi,
          sdt_khach: soDienThoai,
          phuong_thuc_thanh_toan: "tien_mat",
        });

        const savedSelectedItems = JSON.parse(
          localStorage.getItem("selectedCartItems") || "[]"
        );
        setSelectedItems(savedSelectedItems);
        const res = await getGioHangByUser(maNguoiDung);
        const filteredGioHang = res.filter((item) =>
          savedSelectedItems.includes(item.ma_gio_hang)
        );
        setGioHang(filteredGioHang);

        const buyNowItem = JSON.parse(
          localStorage.getItem("buyNowItem") || "[]"
        );
        if (buyNowItem.length > 0) {
          setTempChiTiet(buyNowItem);
        }

        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    loadData();

    initSocket(maNguoiDung, (event, data) => {
      alert(
        `Đơn hàng ${data.ma_don_hang} đã được ${
          event === "new" ? "tạo" : "cập nhật"
        }: ${data.trang_thai}`
      );
    });

    return () => {
      disconnectSocket();
      localStorage.removeItem("buyNowItem");
    };
  }, [maNguoiDung, token]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setOrderInfo((prev) => ({ ...prev, [name]: value }));
  };

  const resetToDefault = () => {
    setOrderInfo({
      ten_khach: localStorage.getItem("ho_ten") || "",
      dia_chi_khach: localStorage.getItem("dia_chi") || "",
      sdt_khach: localStorage.getItem("so_dien_thoai") || "",
      phuong_thuc_thanh_toan: "tien_mat",
    });
  };

  const handlePlaceOrder = async () => {
    if (!maNguoiDung || !token) {
      alert("Vui lòng đăng nhập để đặt hàng.");
      navigate("/login");
      return;
    }
    if (selectedItems.length === 0 && tempChiTiet.length === 0) {
      alert("Không có mục nào được chọn để đặt hàng.");
      navigate(`/gio-hang/${maNguoiDung}`);
      return;
    }
    if (
      !orderInfo.ten_khach ||
      !orderInfo.dia_chi_khach ||
      !orderInfo.sdt_khach
    ) {
      alert("Vui lòng nhập đầy đủ thông tin khách hàng.");
      return;
    }

    try {
      const chiTietPayload = tempChiTiet.map((item) => ({
        ma_do_uong: item.ma_do_uong,
        so_luong: item.so_luong,
        tuy_chon: item.tuy_chon,
        ghi_chu: item.ghi_chu || null,
      }));

      const result = await createDonHang({
        ma_nguoi_dung: Number(maNguoiDung),
        ten_khach: orderInfo.ten_khach,
        dia_chi_khach: orderInfo.dia_chi_khach,
        sdt_khach: orderInfo.sdt_khach,
        phuong_thuc_thanh_toan: orderInfo.phuong_thuc_thanh_toan,
        ma_gio_hang_ids: selectedItems,
        chi_tiet: chiTietPayload,
      });

      if (result.ma_don_hang) {
        alert("Đặt hàng thành công!");
        await fetchCart();
        localStorage.removeItem("selectedCartItems");
        localStorage.removeItem("buyNowItem");
        setGioHang([]);
        setSelectedItems([]);
        setTempChiTiet([]);
        navigate("/lich-su-don-hang");
      } else {
        throw new Error(result.message || "Đặt hàng thất bại");
      }
    } catch (err) {
      alert(`Đặt hàng thất bại: ${err.message}`);
    }
  };

  if (loading) return <div className="loading">Đang tải...</div>;
  if (error) return <p className="error">{error}</p>;

  return (
    <div className="order-form">
      <h2>Đặt hàng ({selectedItems.length + tempChiTiet.length} mục)</h2>
      {gioHang.length === 0 && tempChiTiet.length === 0 ? (
        <p className="empty-cart">
          Không có mục nào được chọn.{" "}
          <a href={`/gio-hang/${maNguoiDung}`}>Quay lại giỏ hàng</a>
        </p>
      ) : (
        <>
          <div className="cart-items">
            <h3>Danh sách sản phẩm từ giỏ hàng</h3>
            {gioHang.map((item) => (
              <div key={item.ma_gio_hang} className="cart-item">
                <span>{item.ten_do_uong}</span>
                <span>Số lượng: {item.so_luong}</span>
                <span>
                  Tùy chọn:{" "}
                  {item.tuy_chon?.length > 0
                    ? item.tuy_chon
                        .map((opt) => `${opt.loai_tuy_chon}: ${opt.gia_tri}`)
                        .join(", ")
                    : "Không có"}
                </span>
              </div>
            ))}
          </div>

          <div className="temp-items">
            <h3>Sản phẩm thêm mới</h3>
            {tempChiTiet.map((item, index) => (
              <div key={index} className="temp-item">
                <span>{item.ten_do_uong}</span>
                <span>Số lượng: {item.so_luong}</span>
                <span>
                  Tùy chọn:{" "}
                  {item.tuy_chon?.length > 0
                    ? item.tuy_chon
                        .map((opt) => `${opt.loai_tuy_chon}: ${opt.gia_tri}`)
                        .join(", ")
                    : "Không có"}
                </span>
              </div>
            ))}
          </div>

          <div className="order-info">
            <h3>Thông tin khách hàng</h3>
            <input
              name="ten_khach"
              placeholder="Tên khách hàng"
              value={orderInfo.ten_khach}
              onChange={handleInputChange}
              className="input-field"
            />
            <input
              name="dia_chi_khach"
              placeholder="Địa chỉ"
              value={orderInfo.dia_chi_khach}
              onChange={handleInputChange}
              className="input-field"
            />
            <input
              name="sdt_khach"
              placeholder="Số điện thoại"
              value={orderInfo.sdt_khach}
              onChange={handleInputChange}
              className="input-field"
            />
            <p className="info-note">
              Bạn có thể chỉnh sửa thông tin cho đơn hàng này.
            </p>
            <button onClick={resetToDefault} className="reset-button">
              Khôi phục thông tin mặc định
            </button>
            <select
              name="phuong_thuc_thanh_toan"
              value={orderInfo.phuong_thuc_thanh_toan}
              onChange={handleInputChange}
              className="select-field"
            >
              <option value="tien_mat">Tiền mặt</option>
              <option value="chuyen_khoan">Chuyển khoản</option>
              <option value="the">Thẻ</option>
            </select>
          </div>

          <button
            onClick={handlePlaceOrder}
            disabled={selectedItems.length === 0 && tempChiTiet.length === 0}
            className="place-order-button"
          >
            Đặt hàng ({selectedItems.length + tempChiTiet.length} mục)
          </button>
        </>
      )}
    </div>
  );
};

export default OrderForm;
