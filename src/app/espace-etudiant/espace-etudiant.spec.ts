import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EspaceEtudiant } from './espace-etudiant';

describe('EspaceEtudiant', () => {
  let component: EspaceEtudiant;
  let fixture: ComponentFixture<EspaceEtudiant>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EspaceEtudiant],
    }).compileComponents();

    fixture = TestBed.createComponent(EspaceEtudiant);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
