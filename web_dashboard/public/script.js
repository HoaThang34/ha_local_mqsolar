document.addEventListener('DOMContentLoaded', () => {
    const devicesContainer = document.getElementById('devices-container');
    const valApiToken = document.getElementById('val-api-token');
    const lastUpdate = document.getElementById('last-update');
    const dot = document.querySelector('.dot');

    function createDeviceHTML(device) {
        return `
            <div style="margin-bottom: 40px;">
                <h3 style="margin-bottom: 15px; border-bottom: 2px solid var(--border-color); padding-bottom: 5px; color: var(--text-secondary);">
                    Thiết bị: <strong>${device.device_id_masked || 'Không rõ'}</strong>
                </h3>
                <div class="grid-container">
                    <!-- Sản lượng mặt trời -->
                    <div class="card solar">
                        <div class="card-header">
                            <div class="icon-wrapper">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
                                    <circle cx="12" cy="12" r="4"/>
                                </svg>
                            </div>
                            <h2>Sản lượng mặt trời</h2>
                        </div>
                        <div class="card-body">
                            <span class="value">${device.solar_production}</span>
                            <span class="unit">W</span>
                        </div>
                    </div>

                    <!-- Nhà đang sử dụng -->
                    <div class="card home">
                        <div class="card-header">
                            <div class="icon-wrapper">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                                    <polyline points="9 22 9 12 15 12 15 22"/>
                                </svg>
                            </div>
                            <h2>Nhà đang sử dụng</h2>
                        </div>
                        <div class="card-body">
                            <span class="value">${device.home_consumption}</span>
                            <span class="unit">W</span>
                        </div>
                    </div>

                    <!-- Lấy từ lưới -->
                    <div class="card grid-import">
                        <div class="card-header">
                            <div class="icon-wrapper">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M18 15l-6-6-6 6"/>
                                    <path d="M12 21V9"/>
                                </svg>
                            </div>
                            <h2>Lấy từ lưới</h2>
                        </div>
                        <div class="card-body">
                            <span class="value">${device.grid_import}</span>
                            <span class="unit">W</span>
                        </div>
                    </div>

                    <!-- Hòa lưới -->
                    <div class="card grid-export">
                        <div class="card-header">
                            <div class="icon-wrapper">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M6 9l6 6 6-6"/>
                                    <path d="M12 3v12"/>
                                </svg>
                            </div>
                            <h2>Hòa lưới</h2>
                        </div>
                        <div class="card-body">
                            <span class="value">${device.grid_export}</span>
                            <span class="unit">W</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    async function fetchData() {
        try {
            const response = await fetch('/api/data');
            
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            
            const data = await response.json();
            
            // Xóa HTML cũ
            devicesContainer.innerHTML = '';
            
            // Nếu data là mảng (nhiều thiết bị)
            if (Array.isArray(data)) {
                data.forEach(device => {
                    devicesContainer.innerHTML += createDeviceHTML(device);
                });
                
                if (data.length > 0 && data[0].api_token_masked) {
                    valApiToken.textContent = data[0].api_token_masked;
                }
            } else {
                // Nếu chỉ có 1 thiết bị
                devicesContainer.innerHTML = createDeviceHTML(data);
                if (data.api_token_masked) {
                    valApiToken.textContent = data.api_token_masked;
                }
            }
            
            // Cập nhật trạng thái
            const now = new Date();
            lastUpdate.textContent = now.toLocaleTimeString('vi-VN');
            
            dot.classList.add('online');
            
        } catch (error) {
            console.error('Lỗi khi tải dữ liệu:', error);
            dot.classList.remove('online');
            lastUpdate.textContent = 'Mất kết nối';
        }
    }

    // Tải lần đầu
    fetchData();
    
    // Tự động làm mới mỗi 1 giây (thời gian thực)
    setInterval(fetchData, 1000);
});
