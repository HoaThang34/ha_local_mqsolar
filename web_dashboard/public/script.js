document.addEventListener('DOMContentLoaded', () => {
    const devicesContainer = document.getElementById('devices-container');
    const valApiToken = document.getElementById('val-api-token');
    const lastUpdate = document.getElementById('last-update');
    const dot = document.querySelector('.dot');

    function createDeviceHTML(device) {
        // SVG paths mapping: 
        // Solar (25%, 25%) -> Home (50%, 75%)
        // Grid (75%, 25%) -> Home (50%, 75%)
        
        let solarFlowClass = device.solar_production > 0 ? "animate-flow" : "stopped";
        
        let gridFlowClass = "";
        let gridStateClass = "";
        let gridStroke = "";
        let gridText = "";
        let gridValueColor = "";
        let gridIcon = "";

        if (device.grid_import > 0) {
            gridFlowClass = "animate-flow"; // Flow down to home
            gridStateClass = "importing";
            gridStroke = "var(--color-grid)";
            gridText = "Lấy lưới";
            gridValueColor = "var(--color-grid)";
            gridIcon = "▼";
        } else if (device.grid_export > 0) {
            gridFlowClass = "animate-flow reverse"; // Flow up to grid
            gridStateClass = "exporting";
            gridStroke = "var(--color-grid-export)";
            gridText = "Đẩy lưới";
            gridValueColor = "var(--color-grid-export)";
            gridIcon = "▲";
        } else {
            gridFlowClass = "stopped";
            gridStateClass = "idle";
            gridStroke = "#9ca3af";
            gridText = "Điện lưới";
            gridValueColor = "#9ca3af";
            gridIcon = "-";
        }

        // SVG lines are placed entirely across a 600x450 canvas
        const svgLines = `
            <svg class="diagram-lines" viewBox="0 0 600 450">
                <defs>
                    <marker id="arrow-solar" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto">
                        <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--color-solar)" />
                    </marker>
                    <marker id="arrow-grid-import" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto">
                        <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--color-grid)" />
                    </marker>
                    <marker id="arrow-grid-export" markerWidth="10" markerHeight="10" refX="2" refY="5" orient="auto-start-reverse">
                        <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--color-grid-export)" />
                    </marker>
                </defs>
                <!-- Line from Solar (150, 112.5) to Home (300, 337.5) -->
                <path d="M 150 112.5 L 300 337.5" fill="none" stroke="var(--color-solar)" stroke-width="4" class="${solarFlowClass}" marker-end="${device.solar_production > 0 ? 'url(#arrow-solar)' : ''}" />
                
                <!-- Line from Grid (450, 112.5) to Home (300, 337.5) -->
                <path d="M 450 112.5 L 300 337.5" fill="none" stroke="${gridStroke}" stroke-width="4" class="${gridFlowClass}" 
                      ${device.grid_import > 0 ? 'marker-end="url(#arrow-grid-import)"' : (device.grid_export > 0 ? 'marker-start="url(#arrow-grid-export)"' : '')} />
            </svg>
        `;

        return `
            <div class="device-section">
                <div class="device-header">
                    <h3>Thiết bị: <strong>${device.device_id_masked || 'Không rõ'}</strong></h3>
                </div>
                
                <div class="diagram-container">
                    ${svgLines}
                    
                    <!-- Nút: Mặt trời -->
                    <div class="node solar">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="4"/>
                            <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
                        </svg>
                        <div class="label">Mặt trời (DC)</div>
                        <div class="val-container">
                            <span class="value">${device.solar_production}</span>
                            <span class="unit">W</span>
                        </div>
                    </div>

                    <!-- Nút: Lưới điện -->
                    <div class="node grid ${gridStateClass}">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M4 19V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v14"/>
                            <path d="M4 10h16M4 14h16M12 2v20"/>
                        </svg>
                        <div class="label">Lưới điện</div>
                        <div class="val-container">
                            <span class="value">${device.grid_import > 0 ? device.grid_import : device.grid_export}</span>
                            <span class="unit">W</span>
                        </div>
                    </div>

                    <!-- Nút: Nhà -->
                    <div class="node home">
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                            <polyline points="9 22 9 12 15 12 15 22"/>
                        </svg>
                        <div class="label">Nhà đang dùng</div>
                        <div class="val-container">
                            <span class="value">${device.home_consumption}</span>
                            <span class="unit">W</span>
                        </div>
                    </div>

                    <!-- Flow Texts (Placing text on the lines) -->
                    <div class="flow solar-flow">
                        <div class="flow-label">Hòa lưới (AC)</div>
                        <div class="flow-value" style="color: var(--color-solar); border-color: currentColor;">
                            ⚡ ${device.grid_export} W
                        </div>
                    </div>

                    <div class="flow grid-flow">
                        <div class="flow-label">${gridText}</div>
                        <div class="flow-value" style="color: ${gridValueColor}; border-color: currentColor;">
                            ${gridIcon} ${device.grid_import > 0 ? device.grid_import : (device.grid_export > 0 ? device.grid_export : 0)} W
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
            
            devicesContainer.innerHTML = '';
            
            if (Array.isArray(data) && data.length > 0) {
                data.forEach(device => {
                    devicesContainer.innerHTML += createDeviceHTML(device);
                });
                
                if (data[0].api_token_masked) {
                    valApiToken.textContent = data[0].api_token_masked;
                }
            } else if (!Array.isArray(data) && data.device_id_masked) {
                devicesContainer.innerHTML = createDeviceHTML(data);
                if (data.api_token_masked) {
                    valApiToken.textContent = data.api_token_masked;
                }
            } else {
                devicesContainer.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">Chưa có dữ liệu. Vui lòng kiểm tra lại kết nối Inverter hoặc API Token.</p>';
            }
            
            const now = new Date();
            lastUpdate.textContent = now.toLocaleTimeString('vi-VN');
            
            dot.classList.add('online');
            
        } catch (error) {
            console.error('Lỗi khi tải dữ liệu:', error);
            dot.classList.remove('online');
            lastUpdate.textContent = 'Mất kết nối';
        }
    }

    fetchData();
    setInterval(fetchData, 1000);
});
