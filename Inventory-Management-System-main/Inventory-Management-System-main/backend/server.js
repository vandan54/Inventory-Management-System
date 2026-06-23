//import
require('dotenv').config();
const express = require('express');
const cors = require('cors');

//routes
const authRouter = require('./routes/auth-routes');
const ownerRouter = require('./routes/owner-router');
const warehouseRouter = require('./routes/warehouse-routes');
const employeeRouter = require('./routes/employee-routes');
const productRouter = require('./routes/product-routes');
const reportRoutes = require('./routes/report-routes');
const accessRouter = require('./routes/access-routes');
const inventoryRouter = require('./routes/inventory-routes');
const managerRouter = require('./routes/manager-routes');
const inventoryViewRouter = require('./routes/inventory-view-routes');
const dashboardRouter = require('./routes/dashboard-routes');

//initialize
const app = express();

// CORS Configuration
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

//default middleware
app.use(express.json());

//routes
app.use('/api/auth', authRouter);
app.use('/api/owner', ownerRouter);
app.use('/api/warehouse', warehouseRouter);
app.use('/api/employee', employeeRouter);
app.use('/api/products', productRouter);
app.use('/api/reports', reportRoutes);
app.use('/api/access', accessRouter);
app.use('/api/inventory', inventoryRouter);
app.use('/api/manager', managerRouter);
app.use('/api/inventory-view', inventoryViewRouter);
app.use('/api/dashboard', dashboardRouter);

app.use((req, res) => {
    res.status(404).json({
        status: false,
        message: `500 Server Error`
    });
});

//listen the server
port = process.env.SERVER_PORT;
app.listen(port, () => {
    console.log(`[ ${new Date().toLocaleString()} ] : Server started`);
    console.log(`Server running at port : ${port}`);
});