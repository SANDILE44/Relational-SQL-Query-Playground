Markdown
# 🗄️ Enterprise MySQL Data Engine & Analytics Schema

> **Production-ready relational database architecture, normalized schemas, indexed analytical queries, and stored procedures for logistics and freight intelligence.**

![MySQL](https://img.shields.io/badge/MySQL-8.0%2B-blue?style=flat-square&logo=mysql)
![Database Architecture](https://img.shields.io/badge/Architecture-3NF%20%2F%20Star%20Schema-purple?style=flat-square)
![Data Analytics](https://img.shields.io/badge/SQL-Advanced%20Window%20Functions-green?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-brightgreen?style=flat-square)

---

## 📋 Overview

This repository houses the core relational database architecture designed for high-throughput freight operational tracking and enterprise financial margin analytics (`logistics_db`). 

It demonstrates strict database engineering principles, including **3rd Normal Form (3NF) normalization**, foreign key constraints with integrity actions (`ON DELETE CASCADE / SET NULL`), secondary indexing strategies for optimized querying, and automated trigger workflows for margin tracking.

---

## 📐 Entity Relationship & Star Schema Architecture

                   ┌─────────────────────────┐
                   │       Dim_Fleet         │
                   ├─────────────────────────┤
                   │ PK  fleet_id            │
                   │     vehicle_model       │
                   │     registration_number │
                   │     consumption_l_100km │
                   │     maintenance_rate_km │
                   └────────────┬────────────┘
                                │ 1
                                │
                                │ N
┌────────────────────────┐    ┌────┴────────────────────┐
│       Dim_Routes       │    │       Fact_Trips        │
├────────────────────────┤    ├─────────────────────────┤
│ PK  route_id           │ 1  │ PK  trip_id             │
│     corridor_name      ├────┤ FK  fleet_id            │
│     origin_city        │ N  │ FK  route_id            │
│     destination_city   │    │     dispatch_date       │
│     distance_km        │    │     fuel_cost_zar       │
│     toll_fees_zar      │    │     contract_revenue    │
└────────────────────────┘    │     margin_status       │
└─────────────────────────┘


---

## 🌟 Database Design Highlights

1. **Third Normal Form (3NF) Compliance:** Strict separation of transactional trip metrics (`Fact_Trips`) from dimension entities (`Dim_Fleet`, `Dim_Routes`) to eliminate data redundancy.
2. **Optimized Indexes:** Composite B-Tree indexes placed on foreign key joins (`fleet_id`, `route_id`) and date range filters (`dispatch_date`) for fast OLAP aggregation performance.
3. **Automated Audit Triggers:** Custom MySQL triggers that calculate unit operational expense (`cost_per_km`) and automatically update the `margin_status` flag on record insertion.
4. **Analytical Window Functions:** Complex SQL reporting scripts utilizing `SUM() OVER()`, `DENSE_RANK()`, and `LAG()` to audit fuel price creep and corridor profitability across fiscal quarters.

---

## 💻 Sample SQL Implementations

### 1. DDL Schema Definition (Fragment)
```sql

##CREATE TABLE Dim_Fleet (
    fleet_id INT AUTO_INCREMENT PRIMARY KEY,
    vehicle_model VARCHAR(100) NOT NULL,
    registration_number VARCHAR(20) UNIQUE NOT NULL,
    consumption_l_100km DECIMAL(4,1) NOT NULL,
    maintenance_rate_km DECIMAL(5,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE Fact_Trips (
    trip_id INT AUTO_INCREMENT PRIMARY KEY,
    fleet_id INT NOT NULL,
    route_id INT NOT NULL,
    dispatch_date DATE NOT NULL,
    distance_km DECIMAL(8,2) NOT NULL,
    fuel_cost_zar DECIMAL(10,2) NOT NULL,
    toll_fees_zar DECIMAL(10,2) NOT NULL,
    contract_revenue DECIMAL(10,2) NOT NULL,
    margin_status VARCHAR(20) DEFAULT 'PENDING',
    CONSTRAINT fk_trips_fleet FOREIGN KEY (fleet_id) REFERENCES Dim_Fleet(fleet_id) ON DELETE CASCADE,
    CONSTRAINT fk_trips_routes FOREIGN KEY (route_id) REFERENCES Dim_Routes(route_id) ON DELETE RESTRICT,
    INDEX idx_dispatch_fleet (dispatch_date, fleet_id)
) ENGINE=InnoDB;
2. Analytical Margin Audit Query (Aggregation & Window Function)
SQL
SELECT 
    f.vehicle_model,
    r.corridor_name,
    COUNT(t.trip_id) AS total_trips,
    SUM(t.contract_revenue) AS gross_revenue_zar,
    SUM(t.fuel_cost_zar + t.toll_fees_zar) AS total_variable_costs_zar,
    ROUND((SUM(t.contract_revenue) - SUM(t.fuel_cost_zar + t.toll_fees_zar)) / SUM(t.contract_revenue) * 100, 2) AS net_margin_pct,
    DENSE_RANK() OVER (ORDER BY SUM(t.contract_revenue - (t.fuel_cost_zar + t.toll_fees_zar)) DESC) AS profitability_rank
FROM Fact_Trips t
INNER JOIN Dim_Fleet f ON t.fleet_id = f.fleet_id
INNER JOIN Dim_Routes r ON t.route_id = r.route_id
GROUP BY f.vehicle_model, r.corridor_name
HAVING net_margin_pct > 20.00;
