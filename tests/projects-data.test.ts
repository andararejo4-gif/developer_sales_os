import { describe, expect, it } from 'bun:test';
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
} from '../src/lib/projects/projects-data';

describe('Company Projects Multi-Project Architecture', () => {
  it('memiliki daftar proyek terdaftar dengan atribut lengkap', () => {
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

  it('mengembalikan proyek default bila id tidak ditemukan', () => {
    const defaultProj = getProjectById(DEFAULT_PROJECT_ID);
    expect(defaultProj.nama).toContain('The Park');

    const fallbackProj = getProjectById('proyek-tidak-ada');
    expect(fallbackProj.id).toBe(DEFAULT_PROJECT_ID);
  });

  it('dapat menyimpan dan memuat activeProjectId dari storage', () => {
    saveSelectedProjectId('andara-village');
    expect(loadSavedProjectId()).toBe('andara-village');

    // reset ke default
    saveSelectedProjectId(DEFAULT_PROJECT_ID);
    expect(loadSavedProjectId()).toBe(DEFAULT_PROJECT_ID);
  });

  it('mengembalikan inventori unit sesuai proyek aktif', () => {
    const theParkUnits = getUnitsForProject('the-park-sukoharjo');
    expect(theParkUnits.length).toBe(10); // initial sample 10 unit Nagoya, Osaka, Tokyo

    const andaraVillageUnits = getUnitsForProject('andara-village');
    expect(andaraVillageUnits.length).toBe(45);
    expect(andaraVillageUnits.some((u) => u.cluster === 'Bougenville')).toBe(true);
    expect(andaraVillageUnits.some((u) => u.cluster === 'Cempaka')).toBe(true);
    expect(andaraVillageUnits.some((u) => u.cluster === 'Jasmine')).toBe(true);

    const griyaAndaraUnits = getUnitsForProject('griya-andara-asri');
    expect(griyaAndaraUnits.length).toBe(60);
    expect(griyaAndaraUnits.some((u) => u.cluster === 'Blok A')).toBe(true);
  });

  it('dapat memuat dan memperbarui data unit proyek independen', () => {
    const loaded = loadUnitsForProject('andara-village');
    expect(loaded.length).toBe(45);

    const modified = [...loaded, {
      id: 'av-custom-1',
      cluster: 'Bougenville',
      namaUnit: 'A.Custom',
      tipeUnit: 'Tipe 60/90',
      luasTanah: 90,
      luasBangunan: 60,
      hargaCashKeras: 700000000,
      hargaCash6: 720000000,
      hargaCash12: 740000000,
      hargaCash24: 780000000,
      keterangan: 'Unit Tambahan',
      status: 'tersedia' as const,
    }];
    saveUnitsForProject('andara-village', modified);
    expect(loadUnitsForProject('andara-village').length).toBe(46);
  });

  it('dapat menambahkan proyek perumahan baru dan menyimpannya dengan 6 generator output', () => {
    const initialProjects = loadAllProjects();
    const countBefore = initialProjects.length;

    const created = saveNewProject({
      nama: 'Griya Melati Asri Sukoharjo',
      kode: 'GMA',
      tipe: 'Menengah',
      lokasi: 'Gatak, Sukoharjo',
      koordinatGps: '-7.612345, 110.812345',
      radiusKm: 25,
      katalogFile: 'e-katalog_gma_resmi.pdf',
      pricelistFile: 'pricelist_gma_35_unit.xlsx',
      totalUnit: 35,
      kisaranHarga: 'Rp 400 Jt - Rp 650 Jt',
    });

    expect(created.id).toBeDefined();
    expect(created.nama).toBe('Griya Melati Asri Sukoharjo');
    expect(created.totalUnit).toBe(35);
    expect(created.koordinatGps).toBe('-7.612345, 110.812345');
    expect(created.radiusKm).toBe(25);
    expect(created.katalogFile).toBe('e-katalog_gma_resmi.pdf');
    expect(created.pricelistFile).toBe('pricelist_gma_35_unit.xlsx');
    expect(created.generatedOutputs?.suratCinta).toBe(true);
    expect(created.generatedOutputs?.risetPasar).toBe(true);
    expect(created.generatedOutputs?.targetPenjualan).toBe(true);
    expect(created.generatedOutputs?.kalenderKonten).toBe(true);
    expect(created.generatedOutputs?.playbook).toBe(true);
    expect(created.generatedOutputs?.ruteHarian).toBe(true);

    const all = loadAllProjects();
    expect(all.length).toBe(countBefore + 1);
    expect(getProjectById(created.id).nama).toBe('Griya Melati Asri Sukoharjo');

    // Unit proyek baru otomatis dibuat
    const units = loadUnitsForProject(created.id);
    expect(units.length).toBe(35);
  });
});
