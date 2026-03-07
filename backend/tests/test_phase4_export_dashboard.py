"""
Test Phase 4: Export CSV/Excel and Dashboard Stats/Notifications
Tests for:
- Export CSV/Excel for factures
- Export CSV/Excel for pointages
- Dashboard stats API
- Notifications API
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestExportFactures:
    """Tests for /api/export/factures endpoint"""
    
    def test_export_factures_csv(self):
        """Test CSV export of factures"""
        response = requests.get(f"{BASE_URL}/api/export/factures?format=csv")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        # Check content type
        content_type = response.headers.get('Content-Type', '')
        assert 'text/csv' in content_type, f"Expected text/csv, got {content_type}"
        
        # Check content disposition header
        content_disp = response.headers.get('Content-Disposition', '')
        assert 'attachment' in content_disp, f"Expected attachment header, got {content_disp}"
        assert 'factures_' in content_disp, f"Expected factures_ in filename, got {content_disp}"
        assert '.csv' in content_disp, f"Expected .csv extension, got {content_disp}"
        
        # Check CSV content has headers
        content = response.content.decode('utf-8-sig')
        assert 'N° Facture' in content or 'N\xb0 Facture' in content, "CSV should contain header 'N° Facture'"
        print(f"CSV export successful, content length: {len(content)} bytes")
    
    def test_export_factures_excel(self):
        """Test Excel export of factures"""
        response = requests.get(f"{BASE_URL}/api/export/factures?format=excel")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        # Check content type for Excel
        content_type = response.headers.get('Content-Type', '')
        assert 'spreadsheetml' in content_type or 'application/vnd' in content_type, f"Expected Excel content type, got {content_type}"
        
        # Check content disposition header
        content_disp = response.headers.get('Content-Disposition', '')
        assert 'attachment' in content_disp, f"Expected attachment header, got {content_disp}"
        assert '.xlsx' in content_disp, f"Expected .xlsx extension, got {content_disp}"
        
        # Check content is not empty
        assert len(response.content) > 0, "Excel file should not be empty"
        print(f"Excel export successful, content length: {len(response.content)} bytes")
    
    def test_export_factures_csv_with_status_filter(self):
        """Test CSV export with status filter"""
        response = requests.get(f"{BASE_URL}/api/export/factures?format=csv&statut=brouillon")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("CSV export with status filter successful")
    
    def test_export_factures_excel_with_status_filter(self):
        """Test Excel export with status filter"""
        response = requests.get(f"{BASE_URL}/api/export/factures?format=excel&statut=emise")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("Excel export with status filter successful")


class TestExportPointages:
    """Tests for /api/export/pointages endpoint"""
    
    def test_export_pointages_csv(self):
        """Test CSV export of pointages"""
        response = requests.get(f"{BASE_URL}/api/export/pointages?format=csv")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        # Check content type
        content_type = response.headers.get('Content-Type', '')
        assert 'text/csv' in content_type, f"Expected text/csv, got {content_type}"
        
        # Check content disposition header
        content_disp = response.headers.get('Content-Disposition', '')
        assert 'attachment' in content_disp, f"Expected attachment header, got {content_disp}"
        assert 'pointages_' in content_disp, f"Expected pointages_ in filename, got {content_disp}"
        assert '.csv' in content_disp, f"Expected .csv extension, got {content_disp}"
        
        # Check CSV content has headers
        content = response.content.decode('utf-8-sig')
        assert 'Date' in content, "CSV should contain header 'Date'"
        assert 'Chauffeur' in content, "CSV should contain header 'Chauffeur'"
        print(f"CSV export successful, content length: {len(content)} bytes")
    
    def test_export_pointages_excel(self):
        """Test Excel export of pointages"""
        response = requests.get(f"{BASE_URL}/api/export/pointages?format=excel")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        # Check content type for Excel
        content_type = response.headers.get('Content-Type', '')
        assert 'spreadsheetml' in content_type or 'application/vnd' in content_type, f"Expected Excel content type, got {content_type}"
        
        # Check content disposition header
        content_disp = response.headers.get('Content-Disposition', '')
        assert 'attachment' in content_disp, f"Expected attachment header, got {content_disp}"
        assert '.xlsx' in content_disp, f"Expected .xlsx extension, got {content_disp}"
        
        # Check content is not empty
        assert len(response.content) > 0, "Excel file should not be empty"
        print(f"Excel export successful, content length: {len(response.content)} bytes")
    
    def test_export_pointages_csv_with_filters(self):
        """Test CSV export with chauffeur and chantier filters"""
        # First get a chauffeur and chantier ID
        chauffeurs_res = requests.get(f"{BASE_URL}/api/chauffeurs")
        chantiers_res = requests.get(f"{BASE_URL}/api/chantiers")
        
        if chauffeurs_res.status_code == 200 and len(chauffeurs_res.json()) > 0:
            chauffeur_id = chauffeurs_res.json()[0].get('id')
            response = requests.get(f"{BASE_URL}/api/export/pointages?format=csv&chauffeur_id={chauffeur_id}")
            assert response.status_code == 200, f"Expected 200, got {response.status_code}"
            print(f"CSV export with chauffeur filter successful")
        
        if chantiers_res.status_code == 200 and len(chantiers_res.json()) > 0:
            chantier_id = chantiers_res.json()[0].get('id')
            response = requests.get(f"{BASE_URL}/api/export/pointages?format=csv&chantier_id={chantier_id}")
            assert response.status_code == 200, f"Expected 200, got {response.status_code}"
            print(f"CSV export with chantier filter successful")


class TestDashboardStats:
    """Tests for /api/stats/dashboard endpoint"""
    
    def test_dashboard_stats_endpoint(self):
        """Test dashboard stats returns correct structure"""
        response = requests.get(f"{BASE_URL}/api/stats/dashboard")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        
        # Check facturation section
        assert 'facturation' in data, "Response should contain 'facturation' section"
        facturation = data['facturation']
        assert 'ca_mois' in facturation, "facturation should contain 'ca_mois'"
        assert 'ca_annee' in facturation, "facturation should contain 'ca_annee'"
        assert 'factures_en_attente' in facturation, "facturation should contain 'factures_en_attente'"
        assert 'factures_payees' in facturation, "facturation should contain 'factures_payees'"
        
        # Check chantiers section
        assert 'chantiers' in data, "Response should contain 'chantiers' section"
        chantiers = data['chantiers']
        assert 'actifs' in chantiers, "chantiers should contain 'actifs'"
        assert 'termines' in chantiers, "chantiers should contain 'termines'"
        
        # Check activite_mois section
        assert 'activite_mois' in data, "Response should contain 'activite_mois' section"
        activite = data['activite_mois']
        assert 'heures' in activite, "activite_mois should contain 'heures'"
        assert 'tours' in activite, "activite_mois should contain 'tours'"
        assert 'volume' in activite, "activite_mois should contain 'volume'"
        
        # Check flotte section
        assert 'flotte' in data, "Response should contain 'flotte' section"
        
        # Check chauffeurs section
        assert 'chauffeurs' in data, "Response should contain 'chauffeurs' section"
        
        # Check contrats section
        assert 'contrats' in data, "Response should contain 'contrats' section"
        
        # Check evolution_ca (CA evolution chart data)
        assert 'evolution_ca' in data, "Response should contain 'evolution_ca' for chart"
        assert isinstance(data['evolution_ca'], list), "evolution_ca should be a list"
        
        # Check top_clients
        assert 'top_clients' in data, "Response should contain 'top_clients'"
        assert isinstance(data['top_clients'], list), "top_clients should be a list"
        
        print(f"Dashboard stats: CA mois={facturation['ca_mois']}, CA année={facturation['ca_annee']}")
        print(f"Chantiers actifs: {chantiers['actifs']}, terminés: {chantiers['termines']}")
        print(f"Evolution CA entries: {len(data['evolution_ca'])}")
        print(f"Top clients: {len(data['top_clients'])}")
    
    def test_dashboard_stats_ca_values_are_numbers(self):
        """Test that CA values are numeric"""
        response = requests.get(f"{BASE_URL}/api/stats/dashboard")
        assert response.status_code == 200
        
        data = response.json()
        facturation = data['facturation']
        
        assert isinstance(facturation['ca_mois'], (int, float)), "ca_mois should be numeric"
        assert isinstance(facturation['ca_annee'], (int, float)), "ca_annee should be numeric"
        assert facturation['ca_mois'] >= 0, "ca_mois should be non-negative"
        assert facturation['ca_annee'] >= 0, "ca_annee should be non-negative"
        print("CA values are valid numbers")
    
    def test_dashboard_stats_evolution_ca_structure(self):
        """Test evolution_ca has correct structure for charts"""
        response = requests.get(f"{BASE_URL}/api/stats/dashboard")
        assert response.status_code == 200
        
        data = response.json()
        evolution = data['evolution_ca']
        
        if len(evolution) > 0:
            first_entry = evolution[0]
            assert 'mois' in first_entry, "evolution_ca entry should have 'mois'"
            assert 'montant' in first_entry, "evolution_ca entry should have 'montant'"
            print(f"Evolution CA structure valid, {len(evolution)} months of data")
        else:
            print("No evolution CA data yet")


class TestNotifications:
    """Tests for /api/notifications endpoint"""
    
    def test_notifications_endpoint(self):
        """Test notifications returns correct structure"""
        response = requests.get(f"{BASE_URL}/api/notifications")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        
        # Check required fields
        assert 'total' in data, "Response should contain 'total'"
        assert 'high' in data, "Response should contain 'high' priority count"
        assert 'medium' in data, "Response should contain 'medium' priority count"
        assert 'low' in data, "Response should contain 'low' priority count"
        assert 'notifications' in data, "Response should contain 'notifications' list"
        
        # Check notifications is a list
        assert isinstance(data['notifications'], list), "notifications should be a list"
        
        # Check counts are consistent
        total_from_counts = data['high'] + data['medium'] + data['low']
        assert data['total'] == total_from_counts, f"Total {data['total']} should equal sum of priorities {total_from_counts}"
        
        print(f"Notifications: total={data['total']}, high={data['high']}, medium={data['medium']}, low={data['low']}")
    
    def test_notifications_structure(self):
        """Test notification items have correct structure"""
        response = requests.get(f"{BASE_URL}/api/notifications")
        assert response.status_code == 200
        
        data = response.json()
        notifications = data['notifications']
        
        if len(notifications) > 0:
            notif = notifications[0]
            assert 'type' in notif, "Notification should have 'type'"
            assert 'priority' in notif, "Notification should have 'priority'"
            assert 'title' in notif, "Notification should have 'title'"
            assert 'message' in notif, "Notification should have 'message'"
            
            # Check priority is valid
            assert notif['priority'] in ['high', 'medium', 'low'], f"Invalid priority: {notif['priority']}"
            
            print(f"First notification: type={notif['type']}, priority={notif['priority']}")
        else:
            print("No notifications currently")
    
    def test_notifications_sorted_by_priority(self):
        """Test notifications are sorted by priority (high first)"""
        response = requests.get(f"{BASE_URL}/api/notifications")
        assert response.status_code == 200
        
        data = response.json()
        notifications = data['notifications']
        
        if len(notifications) > 1:
            priority_order = {'high': 0, 'medium': 1, 'low': 2}
            for i in range(len(notifications) - 1):
                current_priority = priority_order.get(notifications[i].get('priority', 'low'), 2)
                next_priority = priority_order.get(notifications[i+1].get('priority', 'low'), 2)
                assert current_priority <= next_priority, "Notifications should be sorted by priority"
            print("Notifications are correctly sorted by priority")
        else:
            print("Not enough notifications to test sorting")


class TestOldDashboardStats:
    """Tests for /api/dashboard/stats endpoint (original dashboard)"""
    
    def test_old_dashboard_stats(self):
        """Test original dashboard stats endpoint"""
        response = requests.get(f"{BASE_URL}/api/dashboard/stats")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        
        # Check required fields
        assert 'total_tracteurs' in data, "Should have total_tracteurs"
        assert 'tracteurs_disponibles' in data, "Should have tracteurs_disponibles"
        assert 'total_equipements' in data, "Should have total_equipements"
        assert 'total_chauffeurs' in data, "Should have total_chauffeurs"
        assert 'total_clients' in data, "Should have total_clients"
        assert 'chantiers_en_cours' in data, "Should have chantiers_en_cours"
        
        print(f"Old dashboard stats: tracteurs={data['total_tracteurs']}, chauffeurs={data['total_chauffeurs']}")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
