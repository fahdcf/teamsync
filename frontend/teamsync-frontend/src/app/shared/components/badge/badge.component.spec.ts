import { TestBed, ComponentFixture } from '@angular/core/testing';
import { BadgeComponent } from './badge.component';

describe('BadgeComponent', () => {
  let fixture: ComponentFixture<BadgeComponent>;
  let component: BadgeComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BadgeComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(BadgeComponent);
    component = fixture.componentInstance;
    // detectChanges called inside each test after setting variant
  });

  const statuses: { variant: BadgeComponent['variant']; cssClass: string }[] = [
    { variant: 'success', cssClass: 'badge--success' },
    { variant: 'warning', cssClass: 'badge--warning' },
    { variant: 'danger',  cssClass: 'badge--danger'  },
    { variant: 'info',    cssClass: 'badge--info'    },
    { variant: 'accent',  cssClass: 'badge--accent'  },
    { variant: 'muted',   cssClass: 'badge--muted'   },
  ];

  statuses.forEach(({ variant, cssClass }) => {
    it(`variant "${variant}" maps to CSS class "${cssClass}"`, () => {
      component.variant = variant;
      fixture.detectChanges(); // First detectChanges — sets the initial value, no NG0100
      const el = fixture.nativeElement.querySelector('.badge');
      expect(el.classList.contains(cssClass)).toBe(true);
    });
  });
});
