import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, HostListener } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  LucideChevronDown,
  LucideCctv,
  LucideClock,
  LucideDownload,
  LucideEraser,
  LucideFileVideo,
  LucideLogIn,
  LucideLogOut,
  LucidePlay,
  LucideSearch,
  LucideShieldCheck
} from '@lucide/angular';
import { Camera, ClipResult, SearchCriteria } from './models/cctv.models';
import { AuthService, MockUser } from './services/auth.service';
import { CameraService } from './services/camera.service';
import { ClipSearchService } from './services/clip-search.service';

interface SearchFormValues {
  cameraName: string;
  year: string;
  month: string;
  day: string;
  hour: string;
  minute: string;
}

type SearchField = keyof SearchFormValues;

@Component({
  selector: 'app-root',
  imports: [
    CommonModule,
    FormsModule,
    LucideChevronDown,
    LucideCctv,
    LucideClock,
    LucideDownload,
    LucideEraser,
    LucideFileVideo,
    LucideLogIn,
    LucideLogOut,
    LucidePlay,
    LucideSearch,
    LucideShieldCheck
  ],

  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly cameraService = inject(CameraService);
  private readonly clipSearchService = inject(ClipSearchService);

  cameras: Camera[] = this.cameraService.getCameras();

  readonly months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' }
  ];
  readonly years = [2024, 2025, 2026, 2027, 2028];
  readonly hours = Array.from({ length: 24 }, (_, hour) => hour);
  readonly minutes = Array.from({ length: 60 }, (_, minute) => minute);

  currentUser: MockUser | null = this.authService.getCurrentUser();
  loginUsername = '';
  loginPassword = '';
  loginError = '';
  searchForm: SearchFormValues = this.createDefaultSearchForm();
  searchError = '';
  activeDropdown: SearchField | null = null;
  results: ClipResult[] = [];
  selectedClip: ClipResult | null = null;
  hasSearched = false;
  videoUnavailable = false;

  async ngOnInit(): Promise<void> {
    try {
      const serverCameras = await this.cameraService.fetchCameras();
      if (serverCameras && serverCameras.length > 0) {
        this.cameras = serverCameras;
        // If the default camera isn't in the fetched list, set it to the first camera available
        if (!this.cameras.some(c => c.name === this.searchForm.cameraName)) {
          this.searchForm.cameraName = this.cameras[0]?.name || '';
        }
      }
    } catch (error) {
      console.error('Error in ngOnInit loading cameras:', error);
    }
  }

  @HostListener('document:mousedown', ['$event'])
  onDocumentMouseDown(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.combo-field')) {
      this.activeDropdown = null;
    }
  }



  get isLoggedIn(): boolean {

    return this.currentUser !== null;
  }

  get days(): number[] {
    const year = this.parseNumber(this.searchForm.year, 1900, 3000) ?? new Date().getFullYear();
    const month = this.parseMonth(this.searchForm.month) ?? new Date().getMonth() + 1;
    const daysInMonth = new Date(year, month, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, index) => index + 1);
  }

  login(): void {
    this.loginError = '';

    if (this.authService.login(this.loginUsername, this.loginPassword)) {
      this.currentUser = this.authService.getCurrentUser();
      this.loginUsername = '';
      this.loginPassword = '';
      return;
    }

    this.loginError = 'Username หรือ Password ไม่ถูกต้อง';
  }

  logout(): void {
    this.authService.logout();
    this.currentUser = null;
    this.clearSearch();
  }

  async search(): Promise<void> {
    const parsedCriteria = this.parseSearchCriteria();

    if (!parsedCriteria) {
      this.results = [];
      this.selectedClip = null;
      this.hasSearched = false;
      this.videoUnavailable = false;
      return;
    }

    this.normalizeSearchForm();
    this.results = await this.clipSearchService.search(parsedCriteria);
    this.hasSearched = true;
    this.selectedClip = this.results[0] ?? null;
    this.videoUnavailable = false;
  }


  clearSearch(): void {
    this.searchForm = this.createDefaultSearchForm();
    this.searchError = '';
    this.results = [];
    this.selectedClip = null;
    this.hasSearched = false;
    this.videoUnavailable = false;
  }

  selectClip(clip: ClipResult): void {
    this.selectedClip = clip;
    this.videoUnavailable = false;
  }

  onDatePartChange(): void {
    this.normalizeSearchForm();
  }

  onComboTyping(field: SearchField): void {
    this.activeDropdown = field;

    if (field === 'month') {
      this.normalizeSearchForm();
    }
  }

  onYearTyping(): void {
    this.normalizeSearchForm();
  }

  openDropdown(field: SearchField): void {
    this.activeDropdown = field;
  }

  toggleDropdown(field: SearchField): void {
    this.activeDropdown = this.activeDropdown === field ? null : field;
  }

  closeDropdownLater(): void {
    window.setTimeout(() => {
      this.activeDropdown = null;
    }, 120);
  }

  selectComboOption(field: SearchField, value: string): void {
    this.searchForm[field] = value;
    this.activeDropdown = null;

    if (field === 'year' || field === 'month') {
      this.normalizeSearchForm();
    }
  }

  commitComboInput(field: SearchField): void {
    if (field === 'hour' || field === 'minute') {
      const parsed = this.parseNumber(this.searchForm[field], 0, field === 'hour' ? 23 : 59, true);

      if (typeof parsed === 'number') {
        this.searchForm[field] = this.formatNumber(parsed);
      }
    }

    if (field === 'month') {
      const parsedMonth = this.parseMonth(this.searchForm.month);
      const matchedMonth = this.months.find((month) => month.value === parsedMonth);

      if (matchedMonth) {
        this.searchForm.month = matchedMonth.label;
      }
    }

    if (field === 'year' || field === 'month') {
      this.normalizeSearchForm();
    }

    this.activeDropdown = null;
  }

  getComboOptions(field: SearchField): string[] {
    switch (field) {
      case 'cameraName':
        return this.getFilteredCameraOptions();
      case 'year':
        return [];
      case 'month':
        return this.getFilteredMonthOptions();
      case 'day':
        return this.days.map(String);
      case 'hour':
        return this.hours.map((hour) => this.formatNumber(hour));
      case 'minute':
        return this.minutes.map((minute) => this.formatNumber(minute));
    }
  }

  private getFilteredMonthOptions(): string[] {
    const query = this.searchForm.month.trim().toLowerCase();

    if (!query) {
      return this.months.map((month) => month.label);
    }

    return this.months
      .filter((month) => {
        const monthNumber = String(month.value);
        const paddedMonthNumber = this.formatNumber(month.value);
        const label = month.label.toLowerCase();

        return label.includes(query) || monthNumber.includes(query) || paddedMonthNumber.includes(query);
      })
      .map((month) => month.label);
  }

  private getFilteredCameraOptions(): string[] {
    const query = this.searchForm.cameraName.trim().toLowerCase();

    // If query is empty or is an exact match to one of the cameras, show all options
    const isExactMatch = this.cameras.some(camera => camera.name.toLowerCase() === query);
    if (!query || isExactMatch) {
      return this.cameras.map((camera) => camera.name);
    }

    return this.cameras
      .filter((camera) => {
        const searchableText = `${camera.name} ${camera.location ?? ''} ${camera.status ?? ''}`.toLowerCase();
        return searchableText.includes(query);
      })
      .map((camera) => camera.name);
  }


  markVideoUnavailable(): void {
    this.videoUnavailable = true;
  }

  formatDateTime(timestamp: string): string {
    return new Intl.DateTimeFormat('th-TH-u-ca-gregory', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(new Date(timestamp));
  }

  formatTime(timestamp: string): string {
    return new Intl.DateTimeFormat('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(new Date(timestamp));
  }

  getAbsoluteUrl(relativeUrl: string): string {
    return window.location.origin + relativeUrl;
  }


  formatNumber(value: number): string {
    return value.toString().padStart(2, '0');
  }

  getCameraMeta(cameraName: string): string {
    const camera = this.cameras.find((item) => item.name === cameraName);
    return camera?.location ?? 'Unknown location';
  }

  getStatusText(status: Camera['status']): string {
    switch (status) {
      case 'online':
        return 'Online';
      case 'maintenance':
        return 'Maintenance';
      case 'offline':
        return 'Offline';
      default:
        return 'Unknown';
    }
  }

  private createDefaultSearchForm(): SearchFormValues {
    const today = new Date();
    const defaultCamera = this.cameras[0]?.name ?? 'cctv01';

    return {
      cameraName: defaultCamera,
      year: String(today.getFullYear()),
      month: this.months[today.getMonth()]?.label ?? String(today.getMonth() + 1),
      day: String(today.getDate()),
      hour: '',
      minute: ''
    };
  }

  private normalizeSearchForm(): void {
    const year = this.parseNumber(this.searchForm.year, 1900, 3000);
    const month = this.parseMonth(this.searchForm.month);

    if (!year || !month) {
      return;
    }

    const maxDay = new Date(year, month, 0).getDate();
    const day = this.parseNumber(this.searchForm.day, 1, 31);

    if (day && day > maxDay) {
      this.searchForm.day = String(maxDay);
    }
  }

  private parseSearchCriteria(): SearchCriteria | null {
    this.searchError = '';

    const cameraName = this.searchForm.cameraName.trim();
    const year = this.parseNumber(this.searchForm.year, 1900, 3000);
    const month = this.parseMonth(this.searchForm.month);
    const maxDay = year && month ? new Date(year, month, 0).getDate() : 31;
    const day = this.parseNumber(this.searchForm.day, 1, maxDay);
    const hour = this.parseNumber(this.searchForm.hour, 0, 23, true);
    const minute = this.parseNumber(this.searchForm.minute, 0, 59, true);

    if (!cameraName) {
      this.searchError = 'กรุณาระบุ Camera Name';
      return null;
    }

    if (!year) {
      this.searchError = 'กรุณาระบุ Year เป็นตัวเลข เช่น 2026';
      return null;
    }

    if (!month) {
      this.searchError = 'กรุณาระบุ Month เช่น June หรือ 6';
      return null;
    }

    if (!day) {
      this.searchError = `กรุณาระบุ Day ระหว่าง 1-${maxDay}`;
      return null;
    }

    if (hour === null) {
      this.searchError = 'กรุณาระบุ Hour ระหว่าง 0-23 หรือเว้นว่าง';
      return null;
    }

    if (minute === null) {
      this.searchError = 'กรุณาระบุ Minute ระหว่าง 0-59 หรือเว้นว่าง';
      return null;
    }

    return {
      cameraName,
      year,
      month,
      day,
      hour: hour ?? undefined,
      minute: minute ?? undefined
    };
  }

  private parseMonth(value: string): number | null {
    const normalized = value.trim().toLowerCase();

    if (!normalized) {
      return null;
    }

    const numericMonth = this.parseNumber(normalized, 1, 12);

    if (numericMonth) {
      return numericMonth;
    }

    const matchedMonth = this.months.find((month) => {
      const label = month.label.toLowerCase();
      return label === normalized || label.slice(0, 3) === normalized.slice(0, 3);
    });

    return matchedMonth?.value ?? null;
  }

  private parseNumber(value: string, min: number, max: number, optional = false): number | null | undefined {
    const normalized = value.trim();

    if (!normalized) {
      return optional ? undefined : null;
    }

    const parsed = Number(normalized);

    if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
      return null;
    }

    return parsed;
  }
}
