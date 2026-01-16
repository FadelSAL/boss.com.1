// =============================================
// رابط الموقع الأساسي
// =============================================
const SITE_URL = window.location.href; // سيأخذ الرابط الحالي تلقائياً

// بيانات المحافظات وتكاليف التوصيل في سوريا
let provinces = []; // will be loaded from server

// بيانات المنتجات
let products = [];

// عناصر DOM
const productsContainer = document.getElementById('productsContainer');
const cartIcon = document.getElementById('cartIcon');
const cartModal = document.getElementById('cartModal');
const closeCart = document.getElementById('closeCart');
const cartItems = document.getElementById('cartItems');
const cartTotal = document.getElementById('cartTotal');
const deliveryCost = document.getElementById('deliveryCost');
const grandTotal = document.getElementById('grandTotal');
const cartCount = document.querySelector('.cart-count');
const checkoutForm = document.getElementById('checkoutForm');
const categories = document.querySelectorAll('.category');
const provinceOptions = document.getElementById('provinceOptions');
const selectedProvince = document.getElementById('selectedProvince');
const successAlert = document.getElementById('successAlert');
// admin access button removed from UI; open admin panel by calling `showAdminPanel()` from the console
const loadingScreen = document.getElementById('loadingScreen');

// سلة التسوق
let cart = [];
let currentProvince = null;
let deliveryPrice = 0;

// رقم الواتساب
const whatsappNumber = "963935791571";
// Admin password (change as needed)
const ADMIN_PASSWORD = "boss123";
// runtime flag set after successful login
window.__adminUnlocked = false;

// API base
const API_URL = 'http://localhost:5500/api';

// إخفاء شاشة التحميل
function hideLoadingScreen() {
    // guard in case the element is missing (commented out in index.html)
    if (!loadingScreen) return;
    setTimeout(() => {
        loadingScreen.style.opacity = '0';
        setTimeout(() => {
            loadingScreen.style.display = 'none';
        }, 500);
    }, 1000);
}

// تهيئة المتجر
async function initStore() {
    try {
        // fetch products and provinces from server
        await Promise.all([fetchProductsFromServer(), fetchProvincesFromServer()]);
    } catch (err) {
        console.error('Failed to load from server, falling back to localStorage', err);
        // fall back to localStorage if server unavailable
        const savedProducts = localStorage.getItem('boss_products');
        if (savedProducts) {
            try { products = JSON.parse(savedProducts); } catch (e) { products = []; }
        }
        const savedProvinces = localStorage.getItem('boss_provinces');
        if (savedProvinces) {
            try { provinces = JSON.parse(savedProvinces); } catch (e) { provinces = []; }
        }
    }

    // load cart from localStorage
    const savedCart = localStorage.getItem('boss_cart');
    if (savedCart) {
        try { cart = JSON.parse(savedCart); } catch (e) { cart = []; }
    }

    // إنشاء خيارات المحافظات
    createProvinceOptions();

    // تحميل المنتجات والعرض
    loadAndDisplayProducts();
    updateCart();

    // إخفاء شاشة التحميل
    hideLoadingScreen();
}

// new: fetch products from server
async function fetchProductsFromServer() {
    const res = await fetch(`${API_URL}/products`);
    if (!res.ok) throw new Error('Failed to fetch products');
    const data = await res.json();
    // map server fields to frontend expected fields
    products = data.map(p => ({
        id: p.id,
        name: p.name,
        description: p.description,
        price: Number(p.price),
        image: p.imageUrl || p.image || '',
        category: p.category
    }));
    // cache locally
    localStorage.setItem('boss_products', JSON.stringify(products));
}

// new: fetch provinces from server
async function fetchProvincesFromServer() {
    const res = await fetch(`${API_URL}/provinces`);
    if (!res.ok) throw new Error('Failed to fetch provinces');
    const data = await res.json();
    // map server provinces to expected shape (id as key string)
    provinces = data.map(p => ({ id: p.key || `prov_${p.id}`, name: p.name, cost: Number(p.cost), _dbId: p.id }));
    localStorage.setItem('boss_provinces', JSON.stringify(provinces));
}

// إنشاء خيارات المحافظات
function createProvinceOptions() {
    provinceOptions.innerHTML = '';

    provinces.forEach(province => {
        const option = document.createElement('div');
        option.className = 'province-option';
        option.dataset.id = province.id;
        option.dataset.cost = province.cost;
        option.innerHTML = `
                    <div>${province.name}</div>
                    <small>${formatPrice(province.cost)} ل.س</small>
                `;

        option.addEventListener('click', function () {
            document.querySelectorAll('.province-option').forEach(opt => {
                opt.classList.remove('selected');
            });
            this.classList.add('selected');
            currentProvince = {
                id: this.dataset.id,
                name: this.querySelector('div').textContent,
                cost: parseInt(this.dataset.cost)
            };
            selectedProvince.value = currentProvince.id;
            deliveryPrice = currentProvince.cost;
            updateCart();
        });

        provinceOptions.appendChild(option);
    });
}

// تحميل وعرض المنتجات
function loadAndDisplayProducts(category = 'all') {
    productsContainer.innerHTML = '';

    if (products.length === 0) {
        productsContainer.innerHTML = `
                    <div class="empty-store">
                        <i class="fas fa-box-open"></i>
                        <h3>المتجر فارغ حالياً</h3>
                        <p>لم يتم إضافة أي منتجات بعد. استخدم لوحة التحكم لإضافة منتجات.</p>
                    </div>
                `;
        return;
    }

    const productsToShow = category === 'all'
        ? products
        : products.filter(product => product.category === category);

    if (productsToShow.length === 0) {
        productsContainer.innerHTML = `
                    <div class="empty-store">
                        <i class="fas fa-search"></i>
                        <h3>لا توجد منتجات في هذا التصنيف</h3>
                        <p>جرب تصنيف آخر</p>
                    </div>
                `;
        return;
    }

    productsToShow.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        productCard.innerHTML = `
                    <img src="${product.image}" alt="${product.name}" class="product-image" onerror="this.src='https://images.unsplash.com/photo-1546069901-ba9599a7e63c?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80'">
                    <div class="product-info">
                        <h3 class="product-title">${product.name}</h3>
                        <p class="product-description">${product.description}</p>
                        <div class="product-price">${formatPrice(product.price)} ل.س</div>
                        <button class="add-to-cart" data-id="${product.id}">
                            <i class="fas fa-cart-plus"></i> أضف إلى السلة
                        </button>
                    </div>
                `;
        productsContainer.appendChild(productCard);
    });

    // إضافة حدث النقر لأزرار إضافة إلى السلة
    document.querySelectorAll('.add-to-cart').forEach(button => {
        button.addEventListener('click', function () {
            const productId = parseInt(this.getAttribute('data-id'));
            addToCart(productId);
        });
    });
}

// تنسيق السعر
function formatPrice(price) {
    return price.toLocaleString('ar-SY');
}

// إضافة منتج إلى السلة
function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    const existingItem = cart.find(item => item.id === productId);

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image,
            quantity: 1
        });
    }

    updateCart();
    saveCartToStorage();

    // إشعار بإضافة المنتج
    showTempAlert(`تم إضافة ${product.name} إلى السلة`, 'success');
}



// تحديث السلة
function updateCart() {
    cartItems.innerHTML = '';
    let total = 0;
    let count = 0;

    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        count += item.quantity;

        const cartItem = document.createElement('div');
        cartItem.className = 'cart-item';
        cartItem.innerHTML = `
                    <div class="item-details">
                        <img src="${item.image}" alt="${item.name}" class="item-image" onerror="this.src='https://images.unsplash.com/photo-1546069901-ba9599a7e63c?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80'">
                        <div class="item-info">
                            <h4>${item.name}</h4>
                            <div class="item-price">${formatPrice(item.price)} ل.س</div>
                        </div>
                    </div>
                    <div class="item-actions">
                        <div class="item-quantity">
                            <button class="quantity-btn decrease" data-id="${item.id}">-</button>
                            <span class="quantity">${item.quantity}</span>
                            <button class="quantity-btn increase" data-id="${item.id}">+</button>
                        </div>
                        <button class="remove-item" data-id="${item.id}">
                            <i class="fas fa-trash"></i> حذف
                        </button>
                    </div>
                `;
        cartItems.appendChild(cartItem);
    });

    cartTotal.textContent = `${formatPrice(total)} ل.س`;
    deliveryCost.textContent = `${formatPrice(deliveryPrice)} ل.س`;
    grandTotal.textContent = `${formatPrice(total + deliveryPrice)} ل.س`;
    cartCount.textContent = count;

    // إضافة الأحداث لأزرار الكمية والحذف
    document.querySelectorAll('.decrease').forEach(btn => {
        btn.addEventListener('click', function () {
            const id = parseInt(this.getAttribute('data-id'));
            decreaseQuantity(id);
        });
    });

    document.querySelectorAll('.increase').forEach(btn => {
        btn.addEventListener('click', function () {
            const id = parseInt(this.getAttribute('data-id'));
            increaseQuantity(id);
        });
    });

    document.querySelectorAll('.remove-item').forEach(btn => {
        btn.addEventListener('click', function () {
            const id = parseInt(this.getAttribute('data-id'));
            removeFromCart(id);
        });
    });
    // تحديث معاينة الرسالة الحية (تُظهر الإيموجيز قبل الإرسال)
    if (typeof updateMessagePreview === 'function') updateMessagePreview();
}

// زيادة كمية المنتج
function increaseQuantity(productId) {
    const item = cart.find(item => item.id === productId);
    if (item) {
        item.quantity += 1;
        updateCart();
        saveCartToStorage();
    }
}

// تقليل كمية المنتج
function decreaseQuantity(productId) {
    const item = cart.find(item => item.id === productId);
    if (item) {
        if (item.quantity > 1) {
            item.quantity -= 1;
        } else {
            removeFromCart(productId);
            return;
        }
        updateCart();
        saveCartToStorage();
    }
}

// إزالة منتج من السلة
function removeFromCart(productId) {
    const item = cart.find(item => item.id === productId);
    cart = cart.filter(item => item.id !== productId);
    updateCart();
    saveCartToStorage();

    if (item) {
        showTempAlert(`تم إزالة${item.name} من السلة`, 'info');
    }
}

// حفظ السلة في localStorage
function saveCartToStorage() {
    localStorage.setItem('boss_cart', JSON.stringify(cart));
}

// حفظ المنتجات في localStorage (keeps local cache; server calls done in admin functions)
function saveProductsToStorage() {
    localStorage.setItem('boss_products', JSON.stringify(products));
}

// حفظ المحافظات في localStorage (keeps local cache; server calls done in admin functions)
function saveProvincesToStorage() {
    localStorage.setItem('boss_provinces', JSON.stringify(provinces));
}

// عرض/إخفاء سلة التسوق
cartIcon.addEventListener('click', () => {
    cartModal.style.display = 'flex';
});

closeCart.addEventListener('click', () => {
    cartModal.style.display = 'none';
});

// إغلاق سلة التسوق بالنقر خارجها
cartModal.addEventListener('click', (e) => {
    if (e.target === cartModal) {
        cartModal.style.display = 'none';
    }
});

// تصفية المنتجات حسب التصنيف
categories.forEach(category => {
    category.addEventListener('click', function () {
        categories.forEach(c => c.classList.remove('active'));
        this.classList.add('active');
        const category = this.getAttribute('data-category');
        loadAndDisplayProducts(category);
    });
});

// تقديم طلب جديد وإرساله على الواتساب
checkoutForm.addEventListener('submit', function (e) {
    e.preventDefault();

    const name = document.getElementById('customerName').value;
    const phone = document.getElementById('customerPhone').value;
    const address = document.getElementById('customerAddress').value;
    const notes = document.getElementById('customerNotes').value;
    const provinceId = selectedProvince.value;

    if (cart.length === 0) {
        showTempAlert('سلة التسوق فارغة!', 'info');
        return;
    }

    if (!provinceId) {
        showTempAlert('الرجاء اختيار المحافظة', 'info');
        return;
    }

    const province = provinces.find(p => p.id === provinceId);

    // إنشاء رسالة الطلب
    const orderMessage = createOrderMessage(name, phone, address, notes, province);

    // إرسال الطلب على الواتساب (يفتح الدردشة مع الرقم الذي أدخله المستخدم)
    sendOrderToWhatsApp(orderMessage, whatsappNumber);

    // إظهار تنبيه النجاح
    successAlert.style.display = 'block';
    setTimeout(() => {
        successAlert.style.display = 'none';
    }, 5000);

    // إعادة تعيين النموذج وإفراغ السلة
    checkoutForm.reset();
    document.querySelectorAll('.province-option').forEach(opt => {
        opt.classList.remove('selected');
    });
    currentProvince = null;
    deliveryPrice = 0;
    selectedProvince.value = '';
    cart = [];
    updateCart();
    saveCartToStorage();

    // إغلاق سلة التسوق
    cartModal.style.display = 'none';
});

// إنشاء رسالة الطلب (تم التعديل)
function createOrderMessage(name, phone, address, notes, province) {
    let message = `🛒 * طلب جديد من متجر BOSS *\n`;
    message += ` 📍 ${SITE_URL} \n\n`;
    message += `👤 * العميل:* ${name} \n`;
    message += `📞 * الهاتف:* ${phone} \n`;
    message += `📍 * العنوان:* ${address} \n`;
    message += `🏙 * المحافظة:* ${province.name} \n`;

    if (notes) {
        message += `📝 * ملاحظات:* ${notes} \n`;
    }

    message += `\n🛍 * المنتجات:*\n`;
    cart.forEach(item => {
        message += `• ${item.name} (${item.quantity}) - ${formatPrice(item.price * item.quantity)} ل.س\n`;
    });

    const itemsTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    message += `\n💰 * المجموع:* ${formatPrice(itemsTotal)} ل.س\n`;
    message += `🚚 * تكلفة التوصيل:* ${formatPrice(province.cost)} ل.س\n`;
    message += `💵 * المجموع الكلي:* ${formatPrice(itemsTotal + province.cost)} ل.س\n`;
    message += ` \n⏰ * وقت الطلب:* ${new Date().toLocaleString('ar-SY')} \n`;
    message += `🆔 * رقم الطلب:* #${Date.now().toString().substr(-6)}`;

    return message;
}

// تحديث معاينة رسالة الطلب على الصفحة (تظهر الإيموجي مباشرة)
function updateMessagePreview() {
    const previewEl = document.getElementById('messagePreview');
    if (!previewEl) return;

    const name = document.getElementById('customerName') ? document.getElementById('customerName').value : '';
    const phone = document.getElementById('customerPhone') ? document.getElementById('customerPhone').value : '';
    const address = document.getElementById('customerAddress') ? document.getElementById('customerAddress').value : '';
    const notes = document.getElementById('customerNotes') ? document.getElementById('customerNotes').value : '';
    const provinceId = selectedProvince ? selectedProvince.value : '';
    const province = provinces.find(p => p.id === provinceId) || { name: 'غير محددة', cost: 0 };

    const previewMsg = createOrderMessage(name || '---', phone || '---', address || '---', notes || '', province);
    // use textContent so emojis render normally
    previewEl.textContent = previewMsg;
}

// إرسال الطلب على الواتساب
function sendOrderToWhatsApp(message) {
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;

    // فتح الواتساب في نافذة جديدة
    window.open(whatsappUrl, '_blank');
}

// إظهار تنبيه مؤقت
function showTempAlert(message, type) {
    const alert = document.createElement('div');
    // set proper classes (alert + type, e.g. 'alert success')
    alert.className = `alert ${type}`;
    alert.textContent = message;
    alert.style.position = 'fixed';
    alert.style.top = '100px';
    alert.style.right = '20px';
    alert.style.zIndex = '10000';
    alert.style.maxWidth = '300px';
    alert.style.display = 'block';

    document.body.appendChild(alert);

    setTimeout(() => {
        alert.remove();
    }, 3000);
}

// Admin access via console: call `showAdminPanel()` from the browser console to open the admin panel.
// Example: open the console (F12) and run `showAdminPanel()`
// (The admin button was removed as requested.)

// Open admin panel with password prompt (call from console)
function openAdminPanel() {
    const pwd = prompt('أدخل كلمة المرور للإدارة:');
    if (pwd === null) return; // cancelled
    if (pwd === ADMIN_PASSWORD) {
        window.__adminUnlocked = true;
        showAdminPanel();
    } else {
        alert('كلمة المرور غير صحيحة!');
    }
}

// عرض لوحة التحكم
function showAdminPanel() {
    // require unlocking first
    if (!window.__adminUnlocked) {
        alert('يرجى فتح اللوحة عبر openAdminPanel() وإدخال كلمة المرور.');
        return;
    }
    // إغلاق أي لوحة تحكم مفتوحة مسبقاً
    const existingPanel = document.querySelector('.admin-panel-overlay');
    if (existingPanel) {
        existingPanel.remove();
    }

    const adminHTML = `
                <div class="admin-panel-overlay" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: white; z-index: 10000; padding: 20px; overflow-y: auto; color: var(--primary);">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 3px solid var(--admin); padding-bottom: 15px;">
                        <h2 style="color: var(--admin);"><i class="fas fa-cogs"></i> لوحة تحكم BOSS Store</h2>
                        <button onclick="closeAdminPanel()" style="background: var(--accent); color: white; border: none; padding: 10px 15px; border-radius: 5px; cursor: pointer; font-weight: bold;">إغلاق اللوحة</button>
                    </div>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                        <div style="background: var(--light); padding: 15px; border-radius: 5px; border-right: 4px solid var(--admin);">
                            <h3 style="color: var(--admin);"><i class="fas fa-chart-bar"></i> إحصائيات سريعة</h3>
                            <p>عدد المنتجات: <strong>${products.length}</strong></p>
                            <p>عدد المحافظات: <strong>${provinces.length}</strong></p>
                            <p>المنتجات في السلة: <strong>${cart.length}</strong></p>
                        </div>
                        
                        <div style="background: var(--light); padding: 15px; border-radius: 5px; border-right: 4px solid var(--success);">
                            <h3 style="color: var(--admin);"><i class="fas fa-tools"></i> إدارة سريعة</h3>
                            <button onclick="addSampleProduct()" style="background: var(--admin); color: white; border: none; padding: 8px 15px; border-radius: 5px; cursor: pointer; margin: 5px; width: 100%;">إضافة منتج تجريبي</button>
                            <button onclick="resetStore()" style="background: var(--accent); color: white; border: none; padding: 8px 15px; border-radius: 5px; cursor: pointer; margin: 5px; width: 100%;">إعادة تعيين المتجر</button>
                        </div>
                    </div>
                    
                    <!-- إدارة المنتجات -->
                    <div style="background: white; padding: 20px; border-radius: 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); margin-bottom: 20px; border: 2px solid var(--admin);">
                        <h3 style="color: var(--admin); margin-bottom: 15px; border-bottom: 2px solid var(--admin); padding-bottom: 10px;"><i class="fas fa-box"></i> إدارة المنتجات</h3>
                        
                        <div class="admin-form">
                            <h4>إضافة منتج جديد</h4>
                            <form id="addProductForm">
                                <div class="form-row">
                                    <div>
                                        <label>اسم المنتج *</label>
                                        <input type="text" id="newProductName" placeholder="أدخل اسم المنتج" required class="form-control">
                                    </div>
                                    <div>
                                        <label>السعر (ل.س) *</label>
                                        <input type="number" id="newProductPrice" placeholder="أدخل السعر بالليرة" required class="form-control">
                                    </div>
                                </div>
                                <div class="form-row">
                                    <div>
                                        <label>التصنيف *</label>
                                        <select id="newProductCategory" class="form-control">
                                            <option value="breakfast">الفطور والمنتجات القابلة للدهن</option>
                                            <option value="chocolate">الشوكولاتة والحلويات ورقائق البطاطس</option>
                                            <option value="frozen">منتجات مجمدة ومبردة</option>
                                            <option value="rice">الأرز والحبوب والمعكرونة</option>
                                            <option value="drinks">الماء والمشروبات والعصائر</option>
                                            <option value="coffee">القهوة والشاي</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label>رابط الصورة *</label>
                                        <input type="url" id="newProductImage" placeholder="https://example.com/image.jpg" required class="form-control">
                                    </div>
                                </div>
                                <div>
                                    <label>وصف المنتج *</label>
                                    <textarea id="newProductDescription" placeholder="أدخل وصف المنتج" required class="form-control" style="height: 80px;"></textarea>
                                </div>
                                <div class="form-actions">
                                    <button type="button" onclick="addNewProduct()" style="background: var(--success); color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; font-weight: bold;">إضافة المنتج</button>
                                    <button type="button" onclick="resetProductForm()" style="background: var(--gray); color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">إعادة تعيين</button>
                                </div>
                            </form>
                        </div>
                        
                        <h4 style="margin-top: 20px;">المنتجات الحالية (${products.length})</h4>
                        ${products.length === 0 ?
            '<p style="text-align: center; padding: 20px; background: var(--light); border-radius: 5px;">لا توجد منتجات حالياً</p>' :
            `<table class="admin-table">
                                <thead>
                                    <tr>
                                        <th>الصورة</th>
                                        <th>الاسم</th>
                                        <th>السعر</th>
                                        <th>التصنيف</th>
                                        <th>الإجراءات</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${products.map(product => `
                                        <tr>
                                            <td style="text-align: center;"><img src="${product.image}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 3px;" onerror="this.src='https://images.unsplash.com/photo-1546069901-ba9599a7e63c?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80'"></td>
                                            <td>${product.name}</td>
                                            <td>${formatPrice(product.price)} ل.س</td>
                                            <td>${getCategoryName(product.category)}</td>
                                            <td style="text-align: center;">
                                                <div class="table-actions">
                                                    <button onclick="editProductFromPanel(${product.id})" class="table-btn edit-btn">تعديل</button>
                                                    <button onclick="deleteProductFromPanel(${product.id})" class="table-btn delete-btn">حذف</button>
                                                </div>
                                            </td>
                                        </tr>
`).join('')}
                                </tbody>
                            </table>`
        }
                    </div>
                    
                    <!-- إدارة المحافظات والتوصيل -->
                    <div style="background: white; padding: 20px; border-radius: 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); margin-bottom: 20px; border: 2px solid var(--admin);">
                        <h3 style="color: var(--admin); margin-bottom: 15px; border-bottom: 2px solid var(--admin); padding-bottom: 10px;"><i class="fas fa-truck"></i> إدارة تكاليف التوصيل</h3>
                        
                        <div class="admin-form">
                            <h4>إضافة/تعديل محافظة</h4>
                            <form id="addProvinceForm">
                                <div class="form-row">
                                    <div>
                                        <label>اسم المحافظة *</label>
                                        <input type="text" id="newProvinceName" placeholder="أدخل اسم المحافظة" required class="form-control">
                                    </div>
                                    <div>
                                        <label>تكلفة التوصيل (ل.س) *</label>
                                        <input type="number" id="newProvinceCost" placeholder="أدخل تكلفة التوصيل" required class="form-control">
                                    </div>
                                </div>
                                <input type="hidden" id="provinceId">
                                <div class="form-actions">
                                    <button type="button" onclick="addOrUpdateProvince()" style="background: var(--success); color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; font-weight: bold;" id="provinceSubmitBtn">إضافة المحافظة</button>
                                    <button type="button" onclick="resetProvinceForm()" style="background: var(--gray); color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">إلغاء</button>
                                </div>
                            </form>
                        </div>
                        
                        <h4 style="margin-top: 20px;">المحافظات الحالية (${provinces.length})</h4>
                        ${provinces.length === 0 ?
            '<p style="text-align: center; padding: 20px; background: var(--light); border-radius: 5px;">لا توجد محافظات مضافة حالياً</p>' :
            `<table class="admin-table">
                                <thead>
                                    <tr>
                                        <th>المحافظة</th>
                                        <th>تكلفة التوصيل</th>
                                        <th>الإجراءات</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${provinces.map(province => `
                                        <tr>
                                            <td>${province.name}</td>
                                            <td>${formatPrice(province.cost)} ل.س</td>
                                            <td style="text-align: center;">
                                                <div class="table-actions">
                                                    <button onclick="editProvinceFromPanel('${province.id}')" class="table-btn edit-btn">تعديل</button>
                                                    <button onclick="deleteProvinceFromPanel('${province.id}')" class="table-btn delete-btn">حذف</button>
                                                </div>
                                            </td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>`
        }
                    </div>
                </div>
            `;

    document.body.insertAdjacentHTML('beforeend', adminHTML);
}

// إغلاق لوحة التحكم
function closeAdminPanel() {
    const adminPanel = document.querySelector('.admin-panel-overlay');
    if (adminPanel) {
        adminPanel.remove();
    }
}

// الحصول على اسم التصنيف
function getCategoryName(categoryId) {
    const categories = {
        'breakfast': 'الفطور والمنتجات القابلة للدهن',
        'chocolate': 'الشوكولاتة والحلويات ورقائق البطاطس',
        'frozen': 'منتجات مجمدة ومبردة',
        'rice': 'الأرز والحبوب والمعكرونة',
        'drinks': 'الماء والمشروبات والعصائر',
        'coffee': 'القهوة والشاي'
    };
    return categories[categoryId] || categoryId;
}

// إعادة تعيين نموذج المنتج
function resetProductForm() {
    document.getElementById('newProductName').value = '';
    document.getElementById('newProductPrice').value = '';
    document.getElementById('newProductImage').value = '';
    document.getElementById('newProductDescription').value = '';
    const addBtn = document.querySelector('#addProductForm button[type="button"]');
    if (addBtn) {
        addBtn.textContent = 'إضافة المنتج';
        addBtn.onclick = addNewProduct;
    }
}

// إعادة تعيين المتجر (محلياً، مع خيار حذف على الخادم)
async function resetStore() {
    if (!confirm('هل أنت متأكد من إعادة تعيين المتجر؟ سيتم مسح البيانات محلياً.')) return;

    // keep copies for optional server deletion
    const serverProducts = products.slice();
    const serverProvinces = provinces.slice();

    // clear local state
    products = [];
    provinces = [];
    cart = [];
    saveProductsToStorage();
    saveProvincesToStorage();
    saveCartToStorage();

    if (confirm('هل تريد أيضاً حذف البيانات من الخادم؟ (سيتم حذف كافة المنتجات والمحافظات نهائياً)')) {
        // delete all products on server
        for (const p of serverProducts) {
            try {
                await fetch(`${API_URL}/products/${p.id}`, { method: 'DELETE' });
            } catch (err) {
                console.error('Failed deleting product on server', p.id, err);
            }
        }
        // delete all provinces on server (use _dbId)
        for (const prov of serverProvinces) {
            try {
                if (prov._dbId) await fetch(`${API_URL}/provinces/${prov._dbId}`, { method: 'DELETE' });
            } catch (err) {
                console.error('Failed deleting province on server', prov.id, err);
            }
        }
    }

    loadAndDisplayProducts();
    createProvinceOptions();
    showAdminPanel();
    updateCart();
    alert('تمت إعادة تعيين المتجر محلياً.');
}

// إعادة تعيين نموذج المحافظة
function resetProvinceForm() {
    document.getElementById('newProvinceName').value = '';
    document.getElementById('newProvinceCost').value = '';
    document.getElementById('provinceId').value = '';
    const btn = document.getElementById('provinceSubmitBtn');
    if (btn) btn.textContent = 'إضافة المحافظة';
}

// تعبئة نموذج تعديل المحافظة
function editProvinceFromPanel(provinceId) {
    const prov = provinces.find(p => p.id === provinceId);
    if (!prov) return;
    document.getElementById('newProvinceName').value = prov.name;
    document.getElementById('newProvinceCost').value = prov.cost;
    document.getElementById('provinceId').value = prov.id;
    const btn = document.getElementById('provinceSubmitBtn');
    if (btn) btn.textContent = 'تحديث المحافظة';
    document.getElementById('newProvinceName').scrollIntoView();
}

// إضافة منتج جديد (server)
async function addNewProduct() {
    const name = document.getElementById('newProductName').value;
    const price = document.getElementById('newProductPrice').value;
    const category = document.getElementById('newProductCategory').value;
    const image = document.getElementById('newProductImage').value;
    const description = document.getElementById('newProductDescription').value;

    if (!name || !price || !image || !description) {
        alert('الرجاء ملء جميع الحقول المطلوبة!');
        return;
    }

    const payload = { name, description, price: Number(price), imageUrl: image, category };

    try {
        const res = await fetch(`${API_URL}/products`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error('Failed to add product');
        const body = await res.json();
        const newId = body.id;
        const newProduct = { id: newId, name, price: Number(price), category, image, description };
        products.unshift(newProduct);
        saveProductsToStorage();

        alert('تم إضافة المنتج بنجاح!');
        showAdminPanel();
        loadAndDisplayProducts();
    } catch (err) {
        console.error(err);
        alert('حدث خطأ أثناء إضافة المنتج، حاول لاحقاً.');
    }
}

// حذف منتج من اللوحة (server)
async function deleteProductFromPanel(productId) {
    if (!confirm('هل أنت متأكد من حذف هذا المنتج؟')) return;
    try {
        const res = await fetch(`${API_URL}/products/${productId}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Delete failed');
        products = products.filter(p => p.id !== productId);
        cart = cart.filter(item => item.id !== productId);
        saveProductsToStorage();
        saveCartToStorage();
        alert('تم حذف المنتج بنجاح!');
        showAdminPanel();
        loadAndDisplayProducts();
        updateCart();
    } catch (err) {
        console.error(err);
        alert('فشل حذف المنتج');
    }
}

// تعديل منتج من اللوحة (prefill form)
function editProductFromPanel(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    document.getElementById('newProductName').value = product.name;
    document.getElementById('newProductPrice').value = product.price;
    document.getElementById('newProductCategory').value = product.category;
    document.getElementById('newProductImage').value = product.image;
    document.getElementById('newProductDescription').value = product.description;

    const addBtn = document.querySelector('#addProductForm button[type="button"]');
    addBtn.textContent = 'تحديث المنتج';
    addBtn.onclick = function () { updateProductFromPanel(productId); };
    document.getElementById('newProductName').scrollIntoView();
}

// تحديث منتج من اللوحة (server)
async function updateProductFromPanel(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    product.name = document.getElementById('newProductName').value;
    product.price = parseFloat(document.getElementById('newProductPrice').value);
    product.category = document.getElementById('newProductCategory').value;
    product.image = document.getElementById('newProductImage').value;
    product.description = document.getElementById('newProductDescription').value;

    const payload = { name: product.name, description: product.description, price: Number(product.price), imageUrl: product.image, category: product.category };

    try {
        const res = await fetch(`${API_URL}/products/${productId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        if (!res.ok) throw new Error('Update failed');
        saveProductsToStorage();
        alert('تم تحديث المنتج بنجاح!');
        showAdminPanel();
        loadAndDisplayProducts();
    } catch (err) {
        console.error(err);
        alert('فشل تحديث المنتج');
    }
}

// إضافة منتج تجريبي (server)
async function addSampleProduct() {
    const sample = {
        name: "منتج تجريبي - شوكولاتة",
        description: "شوكولاتة حليب عالية الجودة، 100 غرام",
        price: 15000,
        category: "chocolate",
        imageUrl: "https://images.unsplash.com/photo-1548907042-0a1484d9d12d?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    };

    try {
        const res = await fetch(`${API_URL}/products`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(sample) });
        if (!res.ok) throw new Error('Failed to add sample');
        const body = await res.json();
        const newProd = { id: body.id, name: sample.name, description: sample.description, price: sample.price, category: sample.category, image: sample.imageUrl };
        products.unshift(newProd);
        saveProductsToStorage();
        alert('تم إضافة المنتج التجريبي بنجاح!');
        showAdminPanel();
        loadAndDisplayProducts();
    } catch (err) {
        console.error(err);
        alert('فشل إضافة المنتج التجريبي');
    }
}

// إضافة أو تحديث محافظة (server)
async function addOrUpdateProvince() {
    const id = document.getElementById('provinceId').value;
    const name = document.getElementById('newProvinceName').value;
    const cost = Number(document.getElementById('newProvinceCost').value);

    if (!name || !cost) {
        alert('الرجاء ملء جميع الحقول المطلوبة!');
        return;
    }

    try {
        if (id) {
            // find local province to get _dbId
            const local = provinces.find(p => p.id === id);
            const dbId = local && local._dbId;
            if (!dbId) throw new Error('Missing DB id for province');
            const payload = { key: id, name, cost };
            const res = await fetch(`${API_URL}/provinces/${dbId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            if (!res.ok) throw new Error('Update failed');
            local.name = name; local.cost = cost;
            saveProvincesToStorage();
            alert('تم تحديث المحافظة بنجاح!');
        } else {
            // create key based on timestamp
            const key = 'prov_' + Date.now();
            const payload = { key, name, cost };
            const res = await fetch(`${API_URL}/provinces`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            if (!res.ok) throw new Error('Create failed');
            const body = await res.json();
            provinces.push({ id: key, name, cost, _dbId: body.id });
            saveProvincesToStorage();
            alert('تم إضافة المحافظة بنجاح!');
        }

        showAdminPanel();
        createProvinceOptions();
    } catch (err) {
        console.error(err);
        alert('فشل حفظ المحافظة');
    }
}

// حذف محافظة من اللوحة (server)
async function deleteProvinceFromPanel(provinceId) {
    if (!confirm('هل أنت متأكد من حذف هذه المحافظة؟')) return;
    try {
        const prov = provinces.find(p => p.id === provinceId);
        if (!prov || !prov._dbId) throw new Error('Missing DB id');
        const res = await fetch(`${API_URL}/provinces/${prov._dbId}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Delete failed');
        provinces = provinces.filter(p => p.id !== provinceId);
        saveProvincesToStorage();
        alert('تم حذف المحافظة بنجاح!');
        showAdminPanel();
        createProvinceOptions();
    } catch (err) {
        console.error(err);
        alert('فشل حذف المحافظة');
    }
}



// التهيئة الأولية
document.addEventListener('DOMContentLoaded', function () {
    initStore();

    // إضافة حدث لإغلاق اللوحة بالضغط على ESC
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            closeAdminPanel();
        }
    });

    // attach live preview updates to form inputs so emojis appear immediately
    const nameEl = document.getElementById('customerName');
    const phoneEl = document.getElementById('customerPhone');
    const addrEl = document.getElementById('customerAddress');
    const notesEl = document.getElementById('customerNotes');

    [nameEl, phoneEl, addrEl, notesEl].forEach(el => {
        if (el) el.addEventListener('input', () => updateMessagePreview());
    });

    // when province selection changes (created dynamically), watch for clicks on options container
    if (provinceOptions) {
        provinceOptions.addEventListener('click', () => setTimeout(() => updateMessagePreview(), 50));
    }

    // update preview initially
    setTimeout(() => updateMessagePreview(), 300);
});