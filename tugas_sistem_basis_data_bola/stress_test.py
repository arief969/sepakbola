from locust import HttpUser, task, between

class WebsiteUser(HttpUser):
    # Waktu tunggu antar request (simulasi user baca halaman)
    wait_time = between(1, 3)

    # Tugas 1: Simulasi User buka halaman Pagination (Harusnya Cepat)
    @task(1)
    def test_pagination(self):
        self.client.get("/test-with-pagination")

    # Tugas 2: Simulasi User buka halaman Berat (Harusnya Lambat/Error)
    @task(1)
    def test_heavy(self):
        self.client.get("/test-no-pagination")