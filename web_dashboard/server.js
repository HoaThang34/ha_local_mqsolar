const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const WebSocket = require('ws');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const apiToken = process.env.API_TOKEN;
const deviceIds = process.env.DEVICE_ID ? process.env.DEVICE_ID.split(',').map(id => id.trim()) : [];

app.use(cors());
app.use(express.json());

// Phục vụ frontend tĩnh
app.use(express.static(path.join(__dirname, 'public')));

// Global cache lưu trữ dữ liệu thiết bị realtime
let deviceDataCache = {};

const maskStr = (str) => {
    if (!str) return 'N/A';
    if (str.length <= 8) return str.slice(0, 2) + '***' + str.slice(-2);
    return str.slice(0, 4) + '...' + str.slice(-4);
};

// Khởi tạo WebSocket kết nối đến MQ Solar Cloud API
if (apiToken && deviceIds.length > 0) {
    let ws;
    let wsReconnectTimeout;

    const connectWS = () => {
        console.log(`Đang kết nối tới MQ Solar Cloud bằng WebSocket...`);
        ws = new WebSocket(`wss://api.manhquansolar.io.vn/ws?token=${apiToken}`);

        ws.on('open', () => {
            console.log('WebSocket Đã kết nối!');
            // Gửi lệnh đăng ký (subscribe) để yêu cầu API trả dữ liệu cho các ID cụ thể
            ws.send(JSON.stringify({
                topic: "subscribe",
                payload: {
                    devices: deviceIds
                }
            }));
            
            // Khởi tạo trạng thái rỗng cho các thiết bị nếu chưa có
            deviceIds.forEach(id => {
                if (!deviceDataCache[id]) {
                    deviceDataCache[id] = {
                        device_id_masked: maskStr(id),
                        api_token_masked: maskStr(apiToken),
                        grid_export: 0,
                        grid_import: 0,
                        home_consumption: 0,
                        solar_production: 0,
                        status: 'Đang kết nối...'
                    };
                }
            });
        });

        ws.on('message', (data) => {
            console.log("RAW WS MSG:", data.toString());
            try {
                const msg = JSON.parse(data);
                
                if (msg.deviceId && msg.payload) {
                    const did = msg.deviceId;
                    const payload = msg.payload;
                    const topic = msg.topic || "";
                    
                    let grid_export = 0;
                    let grid_import = 0;
                    let home_consumption = 0;
                    let solar_production = 0;

                    // Phân loại logic cho Inverter
                    if (topic.includes("grid_tie_inverter") || "dc_voltage" in payload) {
                        const outputPower = parseFloat(payload.output_power || 0);
                        const limiterPower = parseFloat(payload.limmiter_power || 0);
                        const totalPower = parseFloat(payload.total_power || 0);

                        // Ánh xạ theo đúng hiển thị trên App MQ Solar:
                        // "Hòa lưới" (Grid Export) = Công suất Inverter phát ra (output_power)
                        grid_export = outputPower;
                        
                        // "Lấy từ lưới" (Grid Import) = Công suất kéo lưới (limmiter_power)
                        grid_import = limiterPower;
                        
                        // "Nhà đang sử dụng" = Tổng tiêu thụ (total_power)
                        home_consumption = totalPower; 
                        
                        // "Sản lượng mặt trời" = PV Power (Bù hao phí ~5% của inverter: 699 / 0.95 = ~736W)
                        solar_production = Math.round(outputPower / 0.95);
                    } 
                    // Phân loại logic cho Charger (MPPT)
                    else if (topic.includes("mppt_charger") || "pv_voltage" in payload) {
                        const chargePower = parseFloat(payload.charge_power || 0);
                        solar_production = chargePower;
                    }

                    deviceDataCache[did] = {
                        device_id_masked: maskStr(did),
                        api_token_masked: maskStr(apiToken),
                        grid_export: Math.round(grid_export),
                        grid_import: Math.round(grid_import),
                        home_consumption: Math.round(home_consumption),
                        solar_production: Math.round(solar_production),
                        status: 'Online'
                    };
                }
            } catch (err) {
                console.error("Lỗi phân tích dữ liệu WebSocket:", err);
            }
        });

        ws.on('close', () => {
            console.log('WebSocket đã đóng, kết nối lại sau 5 giây...');
            clearTimeout(wsReconnectTimeout);
            wsReconnectTimeout = setTimeout(connectWS, 5000);
        });

        ws.on('error', (err) => {
            console.error('WebSocket gặp lỗi:', err.message);
        });
    };

    connectWS();
} else {
    console.warn("CẢNH BÁO: Không tìm thấy API_TOKEN hoặc DEVICE_ID trong file .env");
}

app.get('/api/data', (req, res) => {
    // Trả về danh sách dữ liệu các thiết bị
    const devicesArray = Object.values(deviceDataCache);
    res.json(devicesArray);
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
