import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getDoUongTheoDanhMuc } from "../api/doUong";
import { fetchDanhSachDanhMuc } from "../api/danh_muc";
import { fetchTuyChonByDoUong } from "../api/tuyChon";
import { addGioHang } from "../api/gioHang";
import { layDanhSachBlog } from "../api/blog";
import { getTopDrinks } from "../api/donHang";
import { useCart } from "../components/gio_hang/cartContext";
import "./home.css";

// Function to remove emojis from text
const removeEmojis = (text) => {
  return text.replace(
    /[\u{1F300}-\u{1F5FF}\u{1F900}-\u{1F9FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}\u{1F191}-\u{1F251}\u{1F004}\u{1F0CF}\u{1F170}-\u{1F171}\u{1F17E}-\u{1F17F}\u{1F18E}\u{3030}\u{2B50}\u{2B55}\u{2934}-\u{2935}\u{2B05}-\u{2B07}\u{2B1B}-\u{2B1C}\u{3297}\u{3299}\u{A9}\u{AE}\u{2122}\u{23F3}\u{24C2}\u{23E9}-\u{23EF}\u{25B6}\u{23F8}-\u{23FA}]/gu,
    ""
  );
};

// Reusable Drink Card Component
const DrinkCard = ({ drink, onAddToCart, onBuyNow }) => {
  if (!drink) return null; // Tránh hiển thị card trống
  const giaGiam =
    drink.giam_gia_phan_tram > 0
      ? Math.round(drink.gia * (1 - drink.giam_gia_phan_tram / 100))
      : drink.gia;

  return (
    <div className="drink-item">
      <div className="drink-content">
        <div className="drink-details">
          {drink.hinh_anh ? (
            <img
              src={`http://localhost:5000/uploads/hinh_anh/${drink.hinh_anh}`}
              alt={drink.ten_do_uong}
              style={{ width: "100%", height: 200, objectFit: "cover" }}
              onClick={() => onAddToCart(drink, true)}
              onError={(e) => {
                console.error(`Failed to load image: ${e.target.src}`);
                e.target.src = "/path/to/default-image.jpg"; // Hình mặc định nếu lỗi
              }}
            />
          ) : (
            <div className="drink-placeholder">Không có hình ảnh</div>
          )}
          {drink.giam_gia_phan_tram > 0 && (
            <span className="discount-badge">-{drink.giam_gia_phan_tram}%</span>
          )}
          <h3>{drink.ten_do_uong || "Tên không xác định"}</h3>
          <p>
            <strong>Giá:</strong>{" "}
            {drink.giam_gia_phan_tram > 0 ? (
              <>
                <span
                  style={{
                    textDecoration: "line-through",
                    color: "#888",
                  }}
                >
                  {Number(drink.gia).toLocaleString()} VNĐ
                </span>{" "}
                <span style={{ color: "#dc2626" }}>
                  {Number(giaGiam).toLocaleString()} VNĐ
                </span>
              </>
            ) : (
              <span>{Number(drink.gia).toLocaleString()} VNĐ</span>
            )}
          </p>
          <div className="drink-actions">
            <button onClick={() => onAddToCart(drink, false)}>
              <i className="fas fa-shopping-cart"></i> Thêm vào giỏ
            </button>
            <button className="buy-now" onClick={() => onBuyNow(drink)}>
              Mua ngay
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Reusable Carousel Component
const Carousel = ({ items, renderItem, scrollKey }) => {
  const scrollRef = useRef(null);
  const [canScroll, setCanScroll] = useState({ left: false, right: true });
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeftStart = useRef(0);

  const checkScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScroll({
      left: scrollLeft > 1,
      right: scrollLeft + clientWidth < scrollWidth - 1,
    });
  };

  useEffect(() => {
    const ref = scrollRef.current;
    if (ref) {
      ref.addEventListener("scroll", checkScroll);
      checkScroll();
    }
    return () => ref?.removeEventListener("scroll", checkScroll);
  }, [items]);

  const scrollBy = (distance) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: distance, behavior: "smooth" });
      if (scrollRef.current.scrollLeft < 0) {
        scrollRef.current.scrollLeft = 0;
      }
    }
  };

  const handleMouseDown = (e) => {
    isDragging.current = true;
    startX.current = e.pageX - scrollRef.current.offsetLeft;
    scrollLeftStart.current = scrollRef.current.scrollLeft;
    scrollRef.current.style.cursor = "grab";
  };

  const handleMouseMove = (e) => {
    if (!isDragging.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX.current) * 2;
    scrollRef.current.scrollLeft = scrollLeftStart.current - walk;
  };

  const handleMouseUp = () => {
    isDragging.current = false;
    scrollRef.current.style.cursor = "grab";
    checkScroll();
  };

  return (
    <div className="carousel-container">
      <button
        className="carousel-btn carousel-btn-left"
        onClick={() => scrollBy(-300)}
        disabled={!canScroll.left}
      >
        ←
      </button>
      <div
        className="carousel"
        ref={scrollRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {items
          .filter((item) => item) // Loại bỏ item undefined/null
          .map((item, index) => (
            <div key={`${scrollKey}-${index}`} className="carousel-item">
              {renderItem(item)}
            </div>
          ))}
      </div>
      <button
        className="carousel-btn carousel-btn-right"
        onClick={() => scrollBy(300)}
        disabled={!canScroll.right}
      >
        →
      </button>
    </div>
  );
};

// Cart Popup Component
const CartPopup = ({
  drink,
  options,
  quantity,
  setQuantity,
  selectedOptions,
  setSelectedOptions,
  onConfirm,
  onCancel,
}) => {
  const giaGiam =
    drink.giam_gia_phan_tram > 0
      ? Math.round(drink.gia * (1 - drink.giam_gia_phan_tram / 100))
      : drink.gia;

  const handleQuantityChange = (type) => {
    setQuantity((prev) =>
      type === "decrease" ? Math.max(1, prev - 1) : prev + 1
    );
  };

  const tinhTongTien = () => {
    const giaSauGiam = giaGiam;
    const tongGiaThem = Object.values(selectedOptions).reduce(
      (sum, opt) => sum + (opt.gia_them || 0),
      0
    );
    return (giaSauGiam + tongGiaThem) * quantity;
  };

  return (
    <div className="cart-popup-overlay" onClick={onCancel}>
      <div className="cart-popup" onClick={(e) => e.stopPropagation()}>
        <h3 className="cart-popup-title">{drink.ten_do_uong}</h3>
        <div className="cart-popup-option">
          <label>Số lượng</label>
          <div className="quantity-control">
            <button onClick={() => handleQuantityChange("decrease")}>-</button>
            <span className="quantity-display">{quantity}</span>
            <button onClick={() => handleQuantityChange("increase")}>+</button>
          </div>
        </div>
        {Object.entries(options).map(([loai, opts]) => (
          <div key={loai} className="cart-popup-option">
            <label>{loai.charAt(0).toUpperCase() + loai.slice(1)}</label>
            {opts.map((opt) => (
              <label key={opt.gia_tri} className="option-item">
                <input
                  type="radio"
                  name={loai}
                  value={opt.gia_tri}
                  checked={selectedOptions[loai]?.gia_tri === opt.gia_tri}
                  onChange={() =>
                    setSelectedOptions((prev) => ({
                      ...prev,
                      [loai]: {
                        gia_tri: opt.gia_tri,
                        gia_them: opt.gia_them || 0,
                      },
                    }))
                  }
                />
                {opt.gia_tri}{" "}
                {opt.gia_them > 0
                  ? `(+${opt.gia_them.toLocaleString()} VNĐ)`
                  : ""}
              </label>
            ))}
          </div>
        ))}
        <p className="cart-popup-total">
          Tổng tiền: <strong>{tinhTongTien().toLocaleString()} VNĐ</strong>
        </p>
        <div className="cart-popup-actions">
          <button className="btn btn-cancel" onClick={onCancel}>
            Hủy
          </button>
          <button className="btn btn-add" onClick={onConfirm}>
            Thêm giỏ hàng
          </button>
        </div>
      </div>
    </div>
  );
};

// Detail Modal Component
const DetailModal = ({
  drink,
  options,
  selectedOptions,
  setSelectedOptions,
  onClose,
}) => {
  const giaGiam =
    drink.giam_gia_phan_tram > 0
      ? Math.round(drink.gia * (1 - drink.giam_gia_phan_tram / 100))
      : drink.gia;

  const tinhTongTien = () => {
    const giaSauGiam = giaGiam;
    const tongGiaThem = Object.values(selectedOptions).reduce(
      (sum, opt) => sum + (opt.gia_them || 0),
      0
    );
    return giaSauGiam + tongGiaThem;
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3 className="modal-header">{drink.ten_do_uong}</h3>
        <div className="modal-body">
          {drink.hinh_anh ? (
            <img
              src={`http://localhost:5000/uploads/hinh_anh/${drink.hinh_anh}`}
              alt={drink.ten_do_uong}
              className="modal-product-image"
              onError={(e) =>
                console.error(`Failed to load image: ${e.target.src}`)
              }
            />
          ) : (
            <div className="modal-image-placeholder">Không có hình ảnh</div>
          )}
          <p className="modal-product-description">
            {drink.mo_ta || "Không có mô tả"}
          </p>
          <p className="modal-product-price">
            Giá:{" "}
            {drink.giam_gia_phan_tram > 0 ? (
              <>
                <span className="new-price">
                  {Number(giaGiam).toLocaleString()} VNĐ
                </span>
                <span className="original-price">
                  {Number(drink.gia).toLocaleString()} VNĐ
                </span>
              </>
            ) : (
              `${Number(drink.gia).toLocaleString()} VNĐ`
            )}
          </p>
          {Object.entries(options).map(([loai, opts]) => (
            <div key={loai} className="option-group">
              <p className="option-group-title">
                {loai.charAt(0).toUpperCase() + loai.slice(1)}
              </p>
              {opts.map((opt) => (
                <label key={`${loai}-${opt.gia_tri}`} className="option-item">
                  <input
                    type="radio"
                    name={loai}
                    value={opt.gia_tri}
                    checked={selectedOptions[loai]?.gia_tri === opt.gia_tri}
                    onChange={() =>
                      setSelectedOptions((prev) => ({
                        ...prev,
                        [loai]: {
                          gia_tri: opt.gia_tri,
                          gia_them: opt.gia_them || 0,
                        },
                      }))
                    }
                    className="radio-input"
                  />
                  {opt.gia_tri}{" "}
                  {opt.gia_them > 0
                    ? `(+${opt.gia_them.toLocaleString()} VNĐ)`
                    : ""}
                </label>
              ))}
            </div>
          ))}
          <p className="total-price">
            Tổng tiền: {tinhTongTien().toLocaleString()} VNĐ
          </p>
        </div>
        <div className="modal-actions">
          <button className="btn btn-close" onClick={onClose}>
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

const HomePage = () => {
  const navigate = useNavigate();
  const { fetchCart } = useCart();

  const [danhMucList, setDanhMucList] = useState([]);
  const [doUongByDanhMuc, setDoUongByDanhMuc] = useState({});
  const [loadingDrinks, setLoadingDrinks] = useState(true);
  const [error, setError] = useState(null);

  const [topDrinks, setTopDrinks] = useState([]);
  const [loadingTopDrinks, setLoadingTopDrinks] = useState(true);

  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedDrink, setSelectedDrink] = useState(null);
  const [drinkOptions, setDrinkOptions] = useState({});
  const [selectedOptions, setSelectedOptions] = useState({});
  const [showCartPopup, setShowCartPopup] = useState(false);
  const [cartQuantity, setCartQuantity] = useState(1);

  const [blogs, setBlogs] = useState([]);
  const [selectedBlog, setSelectedBlog] = useState(null);
  const [loadingBlogs, setLoadingBlogs] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoadingDrinks(true);
        setError(null);

        const resDanhMuc = await fetchDanhSachDanhMuc();
        if (resDanhMuc && Array.isArray(resDanhMuc.data)) {
          setDanhMucList(resDanhMuc.data);
          const drinksData = {};
          for (const dm of resDanhMuc.data) {
            const drinks = await getDoUongTheoDanhMuc(dm.ma_danh_muc);
            drinksData[dm.ma_danh_muc] = drinks.filter(
              (d) => d.hien_thi && d.hinh_anh
            ); // Chỉ lấy sản phẩm có hình ảnh
          }
          setDoUongByDanhMuc(drinksData);
        } else {
          setError("Không thể tải danh sách danh mục");
        }
      } catch (err) {
        setError("Đã xảy ra lỗi khi tải dữ liệu đồ uống");
        console.error("Error loading drinks:", err);
      } finally {
        setLoadingDrinks(false);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    const fetchTopDrinks = async () => {
      try {
        setLoadingTopDrinks(true);
        const data = await getTopDrinks({ limit: 10 });
        setTopDrinks(data.filter((d) => d.hinh_anh)); // Chỉ lấy sản phẩm có hình ảnh
      } catch (err) {
        console.error("Error fetching top drinks:", err.message);
        setError("Không thể tải danh sách đồ uống bán chạy");
      } finally {
        setLoadingTopDrinks(false);
      }
    };
    fetchTopDrinks();
  }, []);

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        setLoadingBlogs(true);
        const data = await layDanhSachBlog();
        setBlogs(data);
      } catch (err) {
        console.error("Error fetching blogs:", err);
        alert("Lấy danh sách blog thất bại!");
      } finally {
        setLoadingBlogs(false);
      }
    };
    fetchBlogs();
  }, []);

  const handleAddToCart = async (drink, showDetails = false) => {
    try {
      const options = await fetchTuyChonByDoUong(drink.ma_do_uong);
      const grouped = {};
      options.forEach((opt) => {
        if (!grouped[opt.loai_tuy_chon]) grouped[opt.loai_tuy_chon] = [];
        grouped[opt.loai_tuy_chon].push(opt);
      });
      setSelectedDrink(drink);
      setDrinkOptions(grouped);
      setSelectedOptions({});

      if (showDetails) {
        setShowDetailModal(true);
      } else {
        setCartQuantity(1);
        setShowCartPopup(true);
      }
    } catch (err) {
      alert("Lỗi khi tải thông tin sản phẩm");
      console.error("Error loading product info:", err);
    }
  };

  const handleBuyNow = async (drink) => {
    try {
      const options = await fetchTuyChonByDoUong(drink.ma_do_uong);
      const grouped = {};
      options.forEach((opt) => {
        if (!grouped[opt.loai_tuy_chon]) grouped[opt.loai_tuy_chon] = [];
        grouped[opt.loai_tuy_chon].push(opt);
      });
      const tempItem = {
        ma_do_uong: drink.ma_do_uong,
        ten_do_uong: drink.ten_do_uong,
        so_luong: 1,
        tuy_chon: Object.entries(grouped).map(([loai, opts]) => ({
          loai_tuy_chon: loai,
          gia_tri: opts[0].gia_tri,
          gia_them: opts[0].gia_them,
        })),
        tong_gia: Math.round(
          drink.gia * (1 - (drink.giam_gia_phan_tram || 0) / 100)
        ),
      };
      localStorage.setItem("buyNowItem", JSON.stringify([tempItem]));
      localStorage.removeItem("selectedCartItems");
      navigate("/don-hang");
    } catch (err) {
      alert(`Thao tác thất bại!\nLỗi: ${err.message || "Không xác định"}`);
    }
  };

  const handleConfirmAddToCart = async () => {
    if (!selectedDrink) return;

    const token = localStorage.getItem("token");
    const maNguoiDung = token ? localStorage.getItem("ma_nguoi_dung") : null;

    if (!maNguoiDung || !token) {
      alert("Bạn chưa đăng nhập. Vui lòng đăng nhập để tiếp tục.");
      setShowCartPopup(false);
      navigate("/login");
      return;
    }

    const tuyChonArr = Object.entries(selectedOptions).map(([loai, opt]) => ({
      loai_tuy_chon: loai,
      gia_tri: opt.gia_tri,
      gia_them: opt.gia_them || 0,
    }));

    try {
      const result = await addGioHang({
        ma_nguoi_dung: Number(maNguoiDung),
        ma_do_uong: selectedDrink.ma_do_uong,
        so_luong: cartQuantity,
        tuy_chon: tuyChonArr,
      });

      if (result && result.success) {
        alert(`Đã thêm "${selectedDrink.ten_do_uong}" vào giỏ hàng!`);
        setShowCartPopup(false);
        setSelectedDrink(null);
        setDrinkOptions({});
        setSelectedOptions({});
        setCartQuantity(1);
        await fetchCart();
      } else {
        throw new Error(result?.message || "Thêm vào giỏ hàng thất bại");
      }
    } catch (err) {
      alert(`Thao tác thất bại!\nLỗi: ${err.message || "Không xác định"}`);
    }
  };

  const handleCancel = () => {
    setShowCartPopup(false);
    setSelectedDrink(null);
    setDrinkOptions({});
    setSelectedOptions({});
    setCartQuantity(1);
  };

  const handleCloseDetailModal = () => {
    setShowDetailModal(false);
    setSelectedDrink(null);
    setDrinkOptions({});
    setSelectedOptions({});
  };

  if (selectedBlog) {
    return (
      <div className="blog-detail-container">
        <button
          className="btn btn-back"
          onClick={() => setSelectedBlog(null)}
          style={{ position: "absolute", top: "1rem", left: "1rem" }}
        >
          ← Quay lại
        </button>
        <h2 className="blog-detail-title">{selectedBlog.tieu_de}</h2>
        <img
          className="blog-detail-image"
          src={`http://localhost:5000/uploads/hinh_anh/${selectedBlog.hinh_anh
            .split("/")
            .pop()}`}
          alt={selectedBlog.tieu_de}
          onError={(e) => {
            console.error(`Failed to load image: ${e.target.src}`);
            e.target.src = "/path/to/default-image.jpg";
          }}
        />
        <p className="blog-detail-content">{selectedBlog.noi_dung}</p>
      </div>
    );
  }

  return (
    <div className="home-container">
      {loadingTopDrinks && <p>Đang tải...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
      {!loadingTopDrinks && topDrinks.length > 0 && (
        <section className="section">
          <h2 className="section-title">
            Đồ Uống Bán Chạy
            <span className="category-separator"></span>
          </h2>
          <div className="drink-list">
            {topDrinks.map((drink) => (
              <DrinkCard
                key={drink.ma_do_uong}
                drink={drink}
                onAddToCart={handleAddToCart}
                onBuyNow={handleBuyNow}
              />
            ))}
          </div>
        </section>
      )}

      {loadingDrinks && <p>Đang tải...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
      {!loadingDrinks && danhMucList.length > 0 && (
        <section className="section">
          <h2 className="section-title">
            Danh Sách Đồ Uống
            <span className="category-separator"></span>
          </h2>
          {danhMucList.map((dm) => (
            <div key={dm.ma_danh_muc} className="category-section">
              <h3 className="category-title">
                {removeEmojis(dm.ten_danh_muc)}
                <span className="category-separator"></span>
              </h3>
              <Carousel
                items={doUongByDanhMuc[dm.ma_danh_muc] || []}
                scrollKey={`category-${dm.ma_danh_muc}`}
                renderItem={(drink) => (
                  <DrinkCard
                    drink={drink}
                    onAddToCart={handleAddToCart}
                    onBuyNow={handleBuyNow}
                  />
                )}
              />
            </div>
          ))}
        </section>
      )}

      {loadingBlogs && <p>Đang tải...</p>}
      {!loadingBlogs && blogs.length > 0 && (
        <section className="section">
          <h2 className="section-title">
            Danh Sách Blog
            <span className="category-separator"></span>
          </h2>
          <Carousel
            items={blogs}
            scrollKey="blog"
            renderItem={(blog) => (
              <div className="blog-card" onClick={() => setSelectedBlog(blog)}>
                <img
                  className="blog-card-image"
                  src={`http://localhost:5000/uploads/hinh_anh/${blog.hinh_anh
                    .split("/")
                    .pop()}`}
                  alt={blog.tieu_de}
                  onError={(e) => {
                    console.error(`Failed to load image: ${e.target.src}`);
                    e.target.src = "/path/to/default-image.jpg";
                  }}
                />
                <h3 className="blog-card-title">{blog.tieu_de}</h3>
              </div>
            )}
          />
        </section>
      )}

      {showCartPopup && selectedDrink && (
        <CartPopup
          drink={selectedDrink}
          options={drinkOptions}
          quantity={cartQuantity}
          setQuantity={setCartQuantity}
          selectedOptions={selectedOptions}
          setSelectedOptions={setSelectedOptions}
          onConfirm={handleConfirmAddToCart}
          onCancel={handleCancel}
        />
      )}
      {showDetailModal && selectedDrink && (
        <DetailModal
          drink={selectedDrink}
          options={drinkOptions}
          selectedOptions={selectedOptions}
          setSelectedOptions={setSelectedOptions}
          onClose={handleCloseDetailModal}
        />
      )}
    </div>
  );
};

export default HomePage;
