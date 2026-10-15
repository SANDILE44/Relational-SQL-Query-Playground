/* ==========================================================================
   RELATIONAL SQL QUERY PLAYGROUND - MOCK DATABASE & EXECUTION ENGINE
   Architect: Sandile Thabede (Sandile SystemsWorks)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

    // 1. MOCK RELATIONAL DATABASE (MySQL Schema Tables)
    const database = {
        Dim_Fleet: [
            { fleet_id: 1, vehicle_model: 'Volvo FH16 540', consumption_l_100km: 38.5, maintenance_rate_km: 3.20 },
            { fleet_id: 2, vehicle_model: 'Scania R500 V8', consumption_l_100km: 36.0, maintenance_rate_km: 2.90 },
            { fleet_id: 3, vehicle_model: 'Mercedes-Benz Actros 2652', consumption_l_100km: 39.2, maintenance_rate_km: 3.40 },
            { fleet_id: 4, vehicle_model: 'MAN TGX 26.480', consumption_l_100km: 35.5, maintenance_rate_km: 2.75 }
        ],
        Dim_Routes: [
            { route_id: 101, corridor_name: 'Durban - Johannesburg (N3)', risk_level: 'Moderate' },
            { route_id: 102, corridor_name: 'Johannesburg - Beitbridge (N1)', risk_level: 'High' },
            { route_id: 103, corridor_name: 'Cape Town - Beaufort West (N1)', risk_level: 'Low' },
            { route_id: 104, corridor_name: 'Richards Bay - Empangeni Corridor', risk_level: 'Low' }
        ],
        Fact_Trips: [
            { trip_id: 501, fleet_id: 1, route_id: 101, distance_km: 600, fuel_cost_zar: 5420.50, toll_fees_zar: 1450.00, contract_revenue: 28000.00 },
            { trip_id: 502, fleet_id: 2, route_id: 102, distance_km: 1200, fuel_cost_zar: 10800.00, toll_fees_zar: 2800.00, contract_revenue: 45000.00 },
            { trip_id: 503, fleet_id: 3, route_id: 103, distance_km: 450, fuel_cost_zar: 4233.60, toll_fees_zar: 620.00, contract_revenue: 19500.00 },
            { trip_id: 504, fleet_id: 4, route_id: 104, distance_km: 180, fuel_cost_zar: 1530.00, toll_fees_zar: 150.00, contract_revenue: 9500.00 },
            { trip_id: 505, fleet_id: 1, route_id: 102, distance_km: 1200, fuel_cost_zar: 11550.00, toll_fees_zar: 2800.00, contract_revenue: 41000.00 }
        ]
    };

    // 2. DOM ELEMENT REFERENCES
    const sqlInput = document.getElementById('sql-input');
    const runBtn = document.getElementById('run-query-btn');
    const statusText = document.getElementById('query-status-text');
    const rowCountBadge = document.getElementById('row-count-badge');
    const tableHead = document.getElementById('table-head');
    const tableBody = document.getElementById('table-body');
    const presetBtns = document.querySelectorAll('.btn-preset');

    // 3. RENDER TABLE FUNCTION
    function renderTable(dataArray) {
        tableHead.innerHTML = '';
        tableBody.innerHTML = '';

        if (!dataArray || dataArray.length === 0) {
            rowCountBadge.textContent = '0 Records';
            statusText.textContent = 'Query executed successfully (0 rows returned)';
            tableBody.innerHTML = '<tr><td colspan="10" style="text-align: center; color: var(--text-muted);">No records found matching query criteria.</td></tr>';
            return;
        }

        // Build Table Headers from object keys
        const headers = Object.keys(dataArray[0]);
        let headerRow = '<tr>';
        headers.forEach(h => {
            headerRow += `<th>${h}</th>`;
        });
        headerRow += '</tr>';
        tableHead.innerHTML = headerRow;

        // Build Table Rows
        let bodyRows = '';
        dataArray.forEach(row => {
            bodyRows += '<tr>';
            headers.forEach(h => {
                let val = row[h];
                // Format numbers if decimals or currency
                if (typeof val === 'number' && !Number.isInteger(val)) {
                    val = val.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                } else if (typeof val === 'number' && h.includes('_zar')) {
                    val = 'R ' + val.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                }
                bodyRows += `<td>${val !== undefined ? val : 'NULL'}</td>`;
            });
            bodyRows += '</tr>';
        });
        tableBody.innerHTML = bodyRows;

        rowCountBadge.textContent = dataArray.length + (dataArray.length === 1 ? ' Record' : ' Records');
        statusText.textContent = `Query executed successfully (${dataArray.length} rows returned)`;
    }

    // 4. SQL QUERY PROCESSOR / SIMULATOR
    function executeQuery(queryString) {
        const query = queryString.trim().toLowerCase();

        // Preset 1: SELECT * FROM Fact_Trips
        if (query.includes('from fact_trips') && !query.includes('join')) {
            renderTable(database.Fact_Trips);
            return;
        }

        // Preset 2: JOIN Fact_Trips and Dim_Fleet
        if (query.includes('join dim_fleet') || query.includes('vehicle_model')) {
            const joinedData = database.Fact_Trips.map(trip => {
                const fleet = database.Dim_Fleet.find(f => f.fleet_id === trip.fleet_id) || {};
                return {
                    trip_id: trip.trip_id,
                    vehicle_model: fleet.vehicle_model || 'N/A',
                    distance_km: trip.distance_km,
                    contract_revenue: 'R ' + trip.contract_revenue.toLocaleString('en-ZA', { minimumFractionDigits: 2 }),
                    fuel_cost_zar: 'R ' + trip.fuel_cost_zar.toLocaleString('en-ZA', { minimumFractionDigits: 2 })
                };
            });
            renderTable(joinedData);
            return;
        }

        // Preset 3: Margin Leaks / Filter
        if (query.includes('where') || query.includes('critical_margins') || query.includes('profit')) {
            const filteredData = database.Fact_Trips.map(trip => {
                const totalCost = trip.fuel_cost_zar + trip.toll_fees_zar;
                const netProfit = trip.contract_revenue - totalCost;
                const marginPct = (netProfit / trip.contract_revenue) * 100;
                return {
                    trip_id: trip.trip_id,
                    distance_km: trip.distance_km,
                    revenue: 'R ' + trip.contract_revenue.toLocaleString('en-ZA', { minimumFractionDigits: 2 }),
                    total_cost: 'R ' + totalCost.toLocaleString('en-ZA', { minimumFractionDigits: 2 }),
                    net_margin: marginPct.toFixed(1) + '%',
                    status: marginPct < 30 ? 'MONITOR' : 'OPTIMAL'
                };
            }).filter(item => parseFloat(item.net_margin) < 70); // Show filtered set
            renderTable(filteredData);
            return;
        }

        // Default Fallback: Return Dim_Fleet table
        if (query.includes('from dim_fleet')) {
            renderTable(database.Dim_Fleet);
            return;
        }

        // General fallback if custom query typed
        renderTable(database.Fact_Trips);
    }

    // 5. EVENT LISTENERS
    runBtn.addEventListener('click', () => {
        runBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Executing...';
        setTimeout(() => {
            executeQuery(sqlInput.value);
            runBtn.innerHTML = '<i class="fa-solid fa-play"></i> Run SQL Query';
        }, 300);
    });

    // Preset button handlers
    presetBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const presetType = btn.getAttribute('data-query');
            if (presetType === 'select_all_trips') {
                sqlInput.value = 'SELECT * FROM Fact_Trips;';
            } else if (presetType === 'join_fleet') {
                sqlInput.value = 'SELECT t.trip_id, f.vehicle_model, t.distance_km, t.contract_revenue, t.fuel_cost_zar \nFROM Fact_Trips t \nJOIN Dim_Fleet f ON t.fleet_id = f.fleet_id;';
            } else if (presetType === 'critical_margins') {
                sqlInput.value = 'SELECT trip_id, distance_km, contract_revenue, (fuel_cost_zar + toll_fees_zar) AS total_expense \nFROM Fact_Trips \nWHERE contract_revenue < 30000;';
            }
            executeQuery(sqlInput.value);
        });
    });

    // Initial Load execution
    executeQuery(sqlInput.value);
});
