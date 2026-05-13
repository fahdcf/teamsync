import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PublicService } from '../../api/public.service';

interface FeatureItem {
  icon: string;
  title: string;
  description: string;
}

interface Testimonial {
  quote: string;
  name: string;
  title: string;
  initials: string;
}

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="landing-page">
      <header class="marketing-nav">
        <a class="brand" routerLink="/home">
          <span class="brand-mark">?</span>
          <span class="brand-text">TeamSync</span>
        </a>

        <nav class="marketing-links">
          <a href="#features">Product</a>
          <a href="#features">Features</a>
          <a href="#collaboration">Solutions</a>
          <a href="#testimonials">Resources</a>
          <a href="#testimonials">Pricing</a>
        </nav>

        <div class="marketing-actions">
          <a routerLink="/login" class="login-link">Log in</a>
          <a routerLink="/register" class="trial-btn">Start free trial -></a>
        </div>
      </header>

      <main>
        <section class="hero-section">
          <div class="hero-left">
            <span class="hero-label">AI-POWERED PROJECT MANAGEMENT</span>
            <h1>
              <span>Collaborate.</span>
              <span>Track.</span>
              <span>Deliver.</span>
            </h1>
            <p>
              TeamSync brings your teams, tasks, and tools together in one intelligent workspace,
              so you can ship exceptional work, every time.
            </p>

            <div class="hero-cta">
              <a routerLink="/register" class="primary-cta">Start free trial -></a>
              <a href="mailto:demo@teamsync.app?subject=TeamSync%20demo%20request" class="secondary-cta">Book a demo</a>
            </div>

            <div class="social-proof">
              <div class="proof-avatars">
                <span>EM</span>
                <span>MJ</span>
                <span>SC</span>
                <span>DL</span>
                <span>LP</span>
              </div>
              <p>Trusted by 25,000+ teams worldwide</p>
            </div>
          </div>

          <div class="hero-right">
            <div class="app-mockup">
              <div class="mockup-head">
                <span class="dot red"></span>
                <span class="dot amber"></span>
                <span class="dot green"></span>
                <span class="sample-badge">Sample workspace data</span>
              </div>
              <div class="mockup-body">
                <aside class="mockup-sidebar">
                  <span class="mock-row active">Home</span>
                  <span class="mock-row">My Tasks</span>
                  <span class="mock-row">Inbox</span>
                </aside>
                <div class="mockup-content">
                  <div class="mockup-stats">
                    <article>
                      <small>Tasks</small>
                      <strong>128</strong>
                    </article>
                    <article>
                      <small>Progress</small>
                      <strong>68%</strong>
                    </article>
                    <article>
                      <small>Members</small>
                      <strong>24</strong>
                    </article>
                  </div>

                  <div class="mini-kanban">
                    <div class="mini-column" *ngFor="let col of ['To do', 'In progress', 'Review', 'Done']">
                      <h4>{{ col }}</h4>
                      <div class="mini-card" *ngFor="let item of [1, 2, 3]">
                        <span class="line short"></span>
                        <span class="line"></span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section class="trusted-section">
          <p>EXAMPLE CUSTOMER LOGOS</p>
          <div class="logos-row">
            <span *ngFor="let logo of logos">{{ logo }}</span>
          </div>
        </section>

        <section id="features" class="feature-section">
          <div class="feature-copy">
            <span>FEATURES PREVIEW</span>
            <h2>Everything your team needs to move faster</h2>
            <p>
              Static marketing examples of the product areas TeamSync is built to support.
            </p>
            <a href="#collaboration">Explore all features -></a>
          </div>

          <div class="feature-grid">
            <article class="feature-card" *ngFor="let feature of features">
              <span class="feature-icon">{{ feature.icon }}</span>
              <h3>{{ feature.title }}</h3>
              <p>{{ feature.description }}</p>
            </article>
          </div>
        </section>

        <section class="showcase-section">
          <div class="showcase-copy">
            <span>SAMPLE ANALYTICS PREVIEW</span>
            <h2>Data that drives better decisions</h2>
            <p>Illustrative report cards showing how project insights can look inside TeamSync.</p>
            <a routerLink="/register">View all reports -></a>
          </div>

          <div class="analytics-panel">
            <article class="analytics-stat" *ngFor="let stat of analyticsStats">
              <small>{{ stat.label }}</small>
              <strong>{{ stat.value }}</strong>
              <svg viewBox="0 0 120 42" preserveAspectRatio="none" aria-hidden="true">
                <path [attr.d]="stat.path"></path>
              </svg>
            </article>
          </div>
        </section>

        <section id="collaboration" class="showcase-section reverse">
          <div class="collaboration-panel">
            <div class="chat-column">
              <h4>Project Alpha</h4>
              <div class="message" *ngFor="let msg of chatPreview">
                <span class="avatar">{{ msg.initials }}</span>
                <div>
                  <strong>{{ msg.name }}</strong>
                  <p>{{ msg.text }}</p>
                </div>
              </div>
            </div>

            <div class="activity-column">
              <h4>Team activity</h4>
              <div class="activity-item" *ngFor="let item of activityPreview">
                <span class="dot"></span>
                <p>{{ item }}</p>
              </div>
            </div>
          </div>

          <div class="showcase-copy">
            <span>SAMPLE COLLABORATION PREVIEW</span>
            <h2>Work together, anywhere</h2>
            <p>Example collaboration cards showing the kind of activity a team workspace can surface.</p>
            <a href="#testimonials">Learn more -></a>
          </div>
        </section>

        <section class="showcase-section">
          <div class="showcase-copy">
            <span>SAMPLE KANBAN PREVIEW</span>
            <h2>Visualize work. Deliver results.</h2>
            <p>Illustrative board cards, not live workspace data, for previewing the product experience.</p>
            <a routerLink="/register">View full board -></a>
          </div>

          <div class="kanban-panel">
            <div class="kanban-col" *ngFor="let column of kanbanColumns">
              <h4>{{ column }}</h4>
              <div class="kanban-card" *ngFor="let i of [1,2,3,4]">
                <span class="line short"></span>
                <span class="line"></span>
                <div class="mini-meta">
                  <span></span><span></span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="testimonials" class="testimonial-section">
          <h2>Loved by teams building the future</h2>
          <p class="sample-note">Sample testimonials used as marketing placeholders until public customer stories are managed dynamically.</p>

          <div class="testimonial-grid">
            <article class="testimonial-card" *ngFor="let testimonial of testimonials">
              <p>{{ testimonial.quote }}</p>
              <div class="author-row">
                <span class="author-avatar">{{ testimonial.initials }}</span>
                <div>
                  <strong>{{ testimonial.name }}</strong>
                  <span>{{ testimonial.title }}</span>
                </div>
              </div>
            </article>
          </div>

          <div class="stats-bar">
            <div class="stat-cell">
              <strong>{{ activeTeamsLabel }}</strong>
              <span>Active teams</span>
            </div>
            <div class="divider"></div>
            <div class="stat-cell">
              <strong>{{ uptimeLabel }}</strong>
              <span>Uptime</span>
            </div>
            <div class="divider"></div>
            <div class="stat-cell">
              <strong>{{ ratingLabel }}</strong>
              <span>User rating</span>
            </div>
          </div>

          <div class="logos-row compact">
            <span *ngFor="let logo of logos">{{ logo }}</span>
          </div>
        </section>
      </main>
    </div>
  `,
  styles: [],
})
export default class LandingComponent implements OnInit {
  private readonly publicService = inject(PublicService);

  activeTeamsLabel = '25K+';
  uptimeLabel = '99.9%';
  ratingLabel = '4.9/5';

  readonly logos = ['Linear', 'Vercel', 'Framer', 'Raycast', 'Notion', 'GitHub'];

  readonly features: FeatureItem[] = [
    { icon: '?', title: 'Task Management', description: 'Organize work, set priorities, and track progress with clarity.' },
    { icon: '?', title: 'Workspace Collaboration', description: 'Bring your team, tools, and conversations together.' },
    { icon: '?', title: 'AI Workflow Automation', description: 'Automate repetitive tasks and accelerate delivery.' },
    { icon: '?', title: 'Analytics & Reports', description: 'Gain insights with clear, actionable performance data.' },
    { icon: '?', title: 'Smart Notifications', description: 'Stay updated with relevant alerts and reminders.' },
    { icon: '?', title: 'Smart Scheduling', description: 'Plan timelines and milestones with confidence.' },
  ];

  readonly analyticsStats = [
    { label: 'Project health', value: '92%', path: 'M0,31 C15,25 28,18 44,24 C62,31 73,14 91,18 C106,20 112,12 120,10' },
    { label: 'Completion rate', value: '68%', path: 'M0,34 C12,29 25,30 40,24 C55,18 64,28 79,19 C95,9 106,15 120,8' },
    { label: 'Team workload', value: 'Balanced', path: 'M0,30 C14,26 24,18 38,20 C52,22 64,28 82,24 C100,20 108,14 120,16' },
    { label: 'Velocity', value: '24.5', path: 'M0,29 C18,15 29,30 45,26 C62,22 71,11 88,14 C104,17 112,27 120,19' },
  ];

  readonly chatPreview = [
    { initials: 'SC', name: 'Sarah Johnson', text: 'The UI kit update is ready for review.' },
    { initials: 'MC', name: 'Mila Chen', text: 'Great call, I will post test results next.' },
    { initials: 'SW', name: 'Sam Wilson', text: 'Pushing polished interactions today.' },
  ];

  readonly activityPreview = [
    'Sarah completed Dashboard analytics',
    'Mila uploaded API integration notes',
    'Sam commented on Performance test',
    'AI Assistant generated 3 suggestions',
  ];

  readonly kanbanColumns = ['To Do', 'In progress', 'Review', 'Done'];

  readonly testimonials: Testimonial[] = [
    {
      quote: 'TeamSync has transformed how we work. It is intuitive, powerful, and helps us ship faster.',
      name: 'Sarah Chen',
      title: 'CEO, TechFlow',
      initials: 'SC',
    },
    {
      quote: 'The best project management tool we have used. Beautiful, reliable, and packed with AI.',
      name: 'Alex Rodriguez',
      title: 'Head of Product, InnovateLab',
      initials: 'AR',
    },
    {
      quote: 'Our team is more aligned than ever. TeamSync keeps everything in one place.',
      name: 'Mike Johnson',
      title: 'Engineering Manager, DevCore',
      initials: 'MJ',
    },
  ];

  ngOnInit(): void {
    this.publicService.getStats().subscribe({
      next: (stats) => {
        this.activeTeamsLabel = `${Math.round(stats.activeTeams / 1000)}K+`;
        this.uptimeLabel = `${stats.uptime}%`;
        this.ratingLabel = `${stats.userRating}/5`;
      },
    });
  }
}
