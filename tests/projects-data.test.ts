import { describe, expect, it } from "bun:test";
import {
  COMPANY_PROJECTS,
  DEFAULT_PROJECT_ID,
  getProjectById,
  loadSavedProjectId,
  saveSelectedProjectId,
  getUnitsForProject,
  loadUnitsForProject,
  saveUnitsForProject,
  loadAllProjects,
  saveNewProject,
  PROJECT_STORAGE_KEY,
  getProjectCoordinates,
  saveProjectCoordinates,
  type ProjectGpsLocation,
} from "../src/lib/projects/projects-data";

describe("Company Projects Multi-Project Architecture", () => {
  it("memiliki daftar proyek terdaftar dengan atribut lengkap", () => {
    expect(COMPANY_PROJECTS.length).toBeGreaterThanOrEqual(3);
    for (const proj of COMPANY_PROJECTS) {
      expect(proj.id).toBeDefined();
      expect(proj.nama).toBeDefined();
      expect(proj.tipe).toBeDefined();
      expect(proj.lokasi).toBeDefined();
      expect(proj.totalUnit).toBeGreaterThan(0);
      expect(proj.kisaranHarga).toBeDefined();
    }
  });

  it("mengembalikan proyek default bila id tidak ditemukan", () => {
    const defaultProj = getProjectById(DEFAULT_PROJECT_ID);
    expect(defaultProj.nama).toContain("The Park");

    const fallbackProj = getProjectById("proyek-tidak-ada");
    expect(fallbackProj.id).toBe(DEFAULT_PROJECT_ID);
  });

  it("dapat menyimpan dan memuat activeProjectId dari storage", () => {
    saveSelectedProjectId("andara-village");
    expect(loadSavedProjectId()).toBe("andara-village");

    // reset ke default
    saveSelectedProjectId(DEFAULT_PROJECT_ID);
    expect(loadSavedProjectId()).toBe(DEFAULT_PROJECT_ID);
  });

  it("mengembalikan inventori unit sesuai proyek aktif", () => {
    const theParkUnits = getUnitsForProject("the-park-sukoharjo");
    expect(theParkUnits.length).toBe(10); // initial sample 10 unit Nagoya, Osaka, Tokyo

    const andaraVillageUnits = getUnitsForProject("andara-village");
    expect(andaraVillageUnits.length).toBe(45);
    expect(andaraVillageUnits.some((u) => u.cluster === "Bougenville")).toBe(
      true,
    );
    expect(andaraVillageUnits.some((u) => u.cluster === "Cempaka")).toBe(true);
    expect(andaraVillageUnits.some((u) => u.cluster === "Jasmine")).toBe(true);

    const griyaAndaraUnits = getUnitsForProject("griya-andara-asri");
    expect(griyaAndaraUnits.length).toBe(60);
    expect(griyaAndaraUnits.some((u) => u.cluster === "Blok A")).toBe(true);
  });

  it("dapat memuat dan memperbarui data unit proyek independen", () => {
    const loaded = loadUnitsForProject("andara-village");
    expect(loaded.length).toBe(45);

    const modified = [
      ...loaded,
      {
        id: "av-custom-1",
        cluster: "Bougenville",
        namaUnit: "A.Custom",
        tipeUnit: "Tipe 60/90",
        luasTanah: 90,
        luasBangunan: 60,
        hargaCashKeras: 700000000,
        hargaCash6: 720000000,
        hargaCash12: 740000000,
        hargaCash24: 780000000,
        keterangan: "Unit Tambahan",
        status: "tersedia" as const,
      },
    ];
    saveUnitsForProject("andara-village", modified);
    expect(loadUnitsForProject("andara-village").length).toBe(46);
  });

  it("dapat menambahkan proyek perumahan baru dan menyimpannya dengan 6 generator output", () => {
    const initialProjects = loadAllProjects();
    const countBefore = initialProjects.length;

    const created = saveNewProject({
      nama: "Griya Melati Asri Sukoharjo",
      kode: "GMA",
      tipe: "Menengah",
      lokasi: "Gatak, Sukoharjo",
      koordinatGps: "-7.612345, 110.812345",
      radiusKm: 25,
      katalogFile: "e-katalog_gma_resmi.pdf",
      pricelistFile: "pricelist_gma_35_unit.xlsx",
      totalUnit: 35,
      kisaranHarga: "Rp 400 Jt - Rp 650 Jt",
    });

    expect(created.id).toBeDefined();
    expect(created.nama).toBe("Griya Melati Asri Sukoharjo");
    expect(created.totalUnit).toBe(35);
    expect(created.koordinatGps).toBe("-7.612345, 110.812345");
    expect(created.radiusKm).toBe(25);
    expect(created.katalogFile).toBe("e-katalog_gma_resmi.pdf");
    expect(created.pricelistFile).toBe("pricelist_gma_35_unit.xlsx");
    expect(created.generatedOutputs?.suratCinta).toBe(true);
    expect(created.generatedOutputs?.risetPasar).toBe(true);
    expect(created.generatedOutputs?.targetPenjualan).toBe(true);
    expect(created.generatedOutputs?.kalenderKonten).toBe(true);
    expect(created.generatedOutputs?.playbook).toBe(true);
    expect(created.generatedOutputs?.ruteHarian).toBe(true);

    const all = loadAllProjects();
    expect(all.length).toBe(countBefore + 1);
    expect(getProjectById(created.id).nama).toBe("Griya Melati Asri Sukoharjo");

    // Unit proyek baru otomatis dibuat
    const units = loadUnitsForProject(created.id);
    expect(units.length).toBe(35);
  });

  it("mendukung 1 proyek dengan multi titik koordinat cluster GPS", () => {
    // 1. Proyek default memiliki titik cluster terdaftar
    const defaultProj = getProjectById("the-park-sukoharjo");
    const coords = getProjectCoordinates(defaultProj);
    expect(coords.length).toBeGreaterThanOrEqual(3);
    expect(coords.some((c) => c.namaCluster.includes("Gerbang Utama"))).toBe(
      true,
    );
    expect(coords.some((c) => c.namaCluster.includes("Nagoya"))).toBe(true);
    expect(coords.some((c) => c.namaCluster.includes("Osaka"))).toBe(true);

    // Titik primer sesuai koordinat utama
    const primary = coords.find((c) => c.isPrimary);
    expect(primary).toBeDefined();
    expect(defaultProj.koordinatGps).toBe(primary!.koordinat);

    // 2. Dapat membuat proyek baru langsung dengan 3 titik koordinat cluster
    const newClusterCoords: ProjectGpsLocation[] = [
      {
        id: "c-1",
        namaCluster: "Gerbang & Cluster Sakura",
        koordinat: "-7.620000, 110.820000",
        isPrimary: true,
      },
      {
        id: "c-2",
        namaCluster: "Cluster Fuji (Tahap 2)",
        koordinat: "-7.621500, 110.821500",
      },
      {
        id: "c-3",
        namaCluster: "Cluster Kyoto (Tahap 3)",
        koordinat: "-7.623000, 110.823000",
      },
    ];

    const multiClusterProject = saveNewProject({
      nama: "Andara Grand Residence",
      kode: "AGR",
      tipe: "Mewah",
      lokasi: "Solo Baru, Sukoharjo",
      koordinatGps: "-7.620000, 110.820000",
      titikKoordinatList: newClusterCoords,
      radiusKm: 25,
      totalUnit: 50,
    });

    expect(multiClusterProject.titikKoordinatList?.length).toBe(3);
    const loadedCoords = getProjectCoordinates(multiClusterProject);
    expect(loadedCoords.length).toBe(3);
    expect(loadedCoords[1].namaCluster).toBe("Cluster Fuji (Tahap 2)");

    // 3. Dapat memperbarui / menambah titik koordinat cluster baru lewat saveProjectCoordinates
    const updatedCoords: ProjectGpsLocation[] = [
      ...loadedCoords,
      {
        id: "c-4",
        namaCluster: "Clubhouse & Pool",
        koordinat: "-7.624000, 110.824000",
      },
    ];
    const savedList = saveProjectCoordinates(
      multiClusterProject.id,
      updatedCoords,
    );
    expect(savedList.length).toBe(4);

    const refreshedProj = getProjectById(multiClusterProject.id);
    expect(refreshedProj.titikKoordinatList?.length).toBe(4);
    expect(refreshedProj.koordinatGps).toBe("-7.620000, 110.820000");
  });
});
