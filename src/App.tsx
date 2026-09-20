/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
// Local storage database simulation without external Firebase connections
import { 
  BookOpen, 
  Users, 
  Award, 
  DollarSign, 
  Plus, 
  Search, 
  ArrowLeft, 
  Calendar, 
  Clock, 
  CheckCircle, 
  Upload, 
  ArrowRight, 
  Lock, 
  User, 
  Sparkles, 
  ChevronRight, 
  X, 
  LogOut, 
  MapPin, 
  CreditCard, 
  TrendingUp, 
  Video,
  FileText,
  Check,
  Shield,
  HelpCircle,
  Smartphone,
  Menu
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================
interface MentoringClass {
  id: string;
  title: string;
  mentorName: string;
  mentorAvatar: string;
  mentorMajor: string;
  mentorRating: number;
  price: number; // always 5000 for crowdfunding
  currentQuota: number;
  maxQuota: number; // usually 10
  category: string;
  description: string;
  dateTime: string;
  duration: string;
  location: string;
  materials: string[];
  isBooked?: boolean;
  classLink?: string;
}

interface ToastMessage {
  id: string;
  type: 'success' | 'info' | 'error';
  title: string;
  message: string;
}

// ============================================================================
// INITIAL MOCK DATA
// ============================================================================
const INITIAL_CLASSES: MentoringClass[] = [];

const CATEGORIES = ['Semua', 'Teknik Informatika', 'Sistem Informasi', 'Kimia', 'Fisika', 'Teknik Tambang', 'Agribisnis', 'Matematika'];

// ============================================================================
// MAIN COMPONENT
// ============================================================================
interface UserAccount {
  nim: string;
  email: string;
  name: string;
  password?: string;
  major?: string;
  isMentor: boolean;
  earnings: number;
}

export default function App() {
  // Global States
  const [activeView, setActiveView] = useState<'login' | 'mentee-dashboard' | 'class-detail' | 'mentor-verification' | 'mentor-dashboard' | 'schedule'>('login');
  
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [isMentor, setIsMentor] = useState<boolean>(false);
  const [selectedClass, setSelectedClass] = useState<MentoringClass | null>(null);
  const [mockClasses, setMockClasses] = useState<MentoringClass[]>([]);
  const [userToken, setUserToken] = useState<string | null>(null);
  
  // Custom interactive states
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Semua');
  const [mentorEarnings, setMentorEarnings] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Registration and Login States
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [loginIdentifier, setLoginIdentifier] = useState(''); // can be NIM or Email
  const [loginPassword, setLoginPassword] = useState('');
  
  const [regName, setRegName] = useState('');
  const [regNim, setRegNim] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regMajor, setRegMajor] = useState('Teknik Informatika');
  const [regPassword, setRegPassword] = useState('');

  // Pending Google User Registration States
  const [pendingGoogleUser, setPendingGoogleUser] = useState<{
    uid: string;
    email: string;
    name: string;
    token: string;
  } | null>(null);
  const [showGoogleRegisterModal, setShowGoogleRegisterModal] = useState(false);
  const [googleRegNim, setGoogleRegNim] = useState('');
  const [googleRegMajor, setGoogleRegMajor] = useState('Teknik Informatika');
  
  // ============================================================================
  // LOCAL STORAGE PERSISTENCE ENGINE & INITIALIZATION
  // ============================================================================
  const DEFAULT_CLASSES: MentoringClass[] = [];

  const syncClassesWithLocalState = (
    classesList: MentoringClass[],
    bookingsList: { nim: string; classId: string }[],
    user: UserAccount | null
  ) => {
    if (!user) {
      const updated = classesList.map(c => ({ ...c, isBooked: false }));
      setMockClasses(updated);
      return;
    }

    const userBookedIds = new Set(
      bookingsList.filter(b => b.nim === user.nim).map(b => b.classId)
    );

    const updated = classesList.map(c => ({
      ...c,
      isBooked: userBookedIds.has(c.id)
    }));
    setMockClasses(updated);
  };

  useEffect(() => {
    // Clear any previous versions' dummy data to guarantee clean state
    const currentVersion = 'paham_v1_clean_empty';
    if (localStorage.getItem('paham_app_version') !== currentVersion) {
      localStorage.clear();
      localStorage.setItem('paham_app_version', currentVersion);
    }

    // 1. Initialize Users
    const existingUsers = localStorage.getItem('paham_users');
    let usersList: UserAccount[] = [];
    if (!existingUsers) {
      const defaultUsers: UserAccount[] = [];
      localStorage.setItem('paham_users', JSON.stringify(defaultUsers));
      usersList = defaultUsers;
    } else {
      usersList = JSON.parse(existingUsers);
    }

    // 2. Initialize Classes
    const existingClasses = localStorage.getItem('paham_classes');
    let classesList: MentoringClass[] = [];
    if (!existingClasses) {
      localStorage.setItem('paham_classes', JSON.stringify(DEFAULT_CLASSES));
      classesList = [...DEFAULT_CLASSES];
    } else {
      classesList = JSON.parse(existingClasses);
    }

    // 3. Initialize Bookings
    const existingBookings = localStorage.getItem('paham_bookings');
    let bookingsList: { nim: string; classId: string }[] = [];
    if (!existingBookings) {
      const defaultBookings: { nim: string; classId: string }[] = [];
      localStorage.setItem('paham_bookings', JSON.stringify(defaultBookings));
      bookingsList = defaultBookings;
    } else {
      bookingsList = JSON.parse(existingBookings);
    }

    // 4. Set current user session
    const storedUser = localStorage.getItem('paham_current_user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      const latestUser = usersList.find(u => u.nim === parsedUser.nim || u.email === parsedUser.email);
      if (latestUser) {
        setCurrentUser(latestUser);
        setIsMentor(latestUser.isMentor);
        setMentorEarnings(latestUser.earnings);
        setUserToken(`local-session-${latestUser.nim}`);
        setActiveView(latestUser.isMentor ? 'mentor-dashboard' : 'mentee-dashboard');
        syncClassesWithLocalState(classesList, bookingsList, latestUser);
        return;
      }
    }

    syncClassesWithLocalState(classesList, bookingsList, null);
  }, []);

  const fetchClasses = async () => {
    // Legacy support, we fetch directly from localStorage instead of endpoint
    const classesList = JSON.parse(localStorage.getItem('paham_classes') || '[]');
    const bookingsList = JSON.parse(localStorage.getItem('paham_bookings') || '[]');
    syncClassesWithLocalState(classesList, bookingsList, currentUser);
  };

  // Mentor Verification States
  const [selectedVerificationSubject, setSelectedVerificationSubject] = useState('Teknik Informatika');
  const [gpaValue, setGpaValue] = useState('3.85');
  const [contactInfo, setContactInfo] = useState('+62 812-3456-7890');
  const [uploadedFile, setUploadedFile] = useState<{ name: string; size: string } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  // Modals / Dialog States
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [isCreateClassOpen, setIsCreateClassOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('150000');
  const [withdrawChannel, setWithdrawChannel] = useState('GoPay');
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  
  // Create Class States
  const [newClassTitle, setNewClassTitle] = useState('');
  const [newClassCategory, setNewClassCategory] = useState('Teknik Informatika');
  const [newClassDescription, setNewClassDescription] = useState('');
  const [newClassDateTime, setNewClassDateTime] = useState('');
  const [newClassDuration, setNewClassDuration] = useState('90 Menit');
  const [newClassLink, setNewClassLink] = useState('');
  
  // Notifications state
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Add a helper notification toast
  const addToast = (type: 'success' | 'info' | 'error', title: string, message: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, type, title, message }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  };

  // Filtered Classes based on search & category
  const filteredClasses = useMemo(() => {
    return mockClasses.filter((c) => {
      const matchesCategory = categoryFilter === 'Semua' || c.category === categoryFilter;
      const matchesSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            c.mentorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            c.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [mockClasses, categoryFilter, searchQuery]);

  // Statistics
  const statistics = useMemo(() => {
    const joinedClassesCount = mockClasses.filter(c => c.isBooked).length;
    const activeClassesForMentor = currentUser 
      ? mockClasses.filter(c => c.mentorName === currentUser.name).length 
      : 0;
    return {
      joinedCount: joinedClassesCount,
      totalAvailable: mockClasses.length,
      afifActiveCount: activeClassesForMentor
    };
  }, [mockClasses, currentUser]);

  // ============================================================================
  // HANDLERS & SIMULATIONS
  // ============================================================================
  const handleGoogleSignIn = () => {
    addToast('info', 'Google Sign-In', 'Menghubungkan ke Google...');
    setTimeout(() => {
      const dummyGoogleUser = {
        uid: "google_" + Math.random().toString(36).substring(2, 9),
        email: "student.google@univ.ac.id",
        name: "Google Student Account",
        token: "google-token-simulated"
      };
      
      const usersList: UserAccount[] = JSON.parse(localStorage.getItem('paham_users') || '[]');
      const existingUser = usersList.find(u => u.email.toLowerCase() === dummyGoogleUser.email.toLowerCase());
      
      if (existingUser) {
        localStorage.setItem('paham_current_user', JSON.stringify(existingUser));
        setCurrentUser(existingUser);
        setIsMentor(existingUser.isMentor);
        setMentorEarnings(existingUser.earnings || 0);
        setUserToken(`local-session-${existingUser.nim}`);

        const bookingsList = JSON.parse(localStorage.getItem('paham_bookings') || '[]');
        const classesList = JSON.parse(localStorage.getItem('paham_classes') || '[]');
        syncClassesWithLocalState(classesList, bookingsList, existingUser);

        addToast('success', 'Selamat Datang Kembali!', `Berhasil masuk dengan akun Google: ${existingUser.name}`);
        setActiveView(existingUser.isMentor ? 'mentor-dashboard' : 'mentee-dashboard');
      } else {
        setPendingGoogleUser(dummyGoogleUser);
        setShowGoogleRegisterModal(true);
        addToast('success', 'Google Terhubung', 'Silakan lengkapi NIM dan Program Studi Anda.');
      }
    }, 800);
  };

  const handleDemoSignIn = (role: 'mentee' | 'mentor') => {
    const nim = role === 'mentee' ? '240601' : '120305';
    const usersList: UserAccount[] = JSON.parse(localStorage.getItem('paham_users') || '[]');
    const user = usersList.find(u => u.nim === nim);

    if (user) {
      localStorage.setItem('paham_current_user', JSON.stringify(user));
      setCurrentUser(user);
      setIsMentor(user.isMentor);
      setMentorEarnings(user.earnings || 0);
      setUserToken(`local-session-${user.nim}`);

      const bookingsList = JSON.parse(localStorage.getItem('paham_bookings') || '[]');
      const classesList = JSON.parse(localStorage.getItem('paham_classes') || '[]');
      syncClassesWithLocalState(classesList, bookingsList, user);

      addToast('success', 'Masuk Sukses!', `Berhasil masuk dalam mode Demo sebagai ${user.name}.`);
      setActiveView(user.isMentor ? 'mentor-dashboard' : 'mentee-dashboard');
    } else {
      addToast('error', 'Demo Gagal', 'Data demo tidak ditemukan. Silakan refresh halaman.');
    }
  };

  const handleGoogleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!googleRegNim || !googleRegMajor || !pendingGoogleUser) {
      addToast('error', 'Registrasi Gagal', 'Harap masukkan NIM dan Program Studi Anda.');
      return;
    }

    const usersList: UserAccount[] = JSON.parse(localStorage.getItem('paham_users') || '[]');
    const isNimTaken = usersList.some(u => u.nim === googleRegNim);
    if (isNimTaken) {
      addToast('error', 'Registrasi Gagal', 'NIM sudah terdaftar.');
      return;
    }

    const newUser: UserAccount = {
      name: pendingGoogleUser.name,
      nim: googleRegNim,
      email: pendingGoogleUser.email,
      password: 'google_linked_account',
      major: googleRegMajor,
      isMentor: false,
      earnings: 0
    };

    const updatedUsers = [...usersList, newUser];
    localStorage.setItem('paham_users', JSON.stringify(updatedUsers));
    localStorage.setItem('paham_current_user', JSON.stringify(newUser));

    setCurrentUser(newUser);
    setIsMentor(false);
    setMentorEarnings(0);
    setUserToken(`local-session-${newUser.nim}`);
    setPendingGoogleUser(null);
    setShowGoogleRegisterModal(false);

    const bookingsList = JSON.parse(localStorage.getItem('paham_bookings') || '[]');
    const classesList = JSON.parse(localStorage.getItem('paham_classes') || '[]');
    syncClassesWithLocalState(classesList, bookingsList, newUser);

    addToast('success', 'Registrasi Berhasil!', 'Akun Google Anda berhasil dikaitkan.');
    setActiveView('mentee-dashboard');
  };

  const handleCancelGoogleRegister = () => {
    setPendingGoogleUser(null);
    setShowGoogleRegisterModal(false);
    addToast('info', 'Registrasi Dibatalkan', 'Proses masuk Google dibatalkan.');
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginIdentifier || !loginPassword) {
      addToast('error', 'Login Gagal', 'Harap isi NIM / Email dan Kata Sandi Anda.');
      return;
    }

    const usersList: UserAccount[] = JSON.parse(localStorage.getItem('paham_users') || '[]');
    const user = usersList.find(
      u => (u.nim === loginIdentifier || u.email.toLowerCase() === loginIdentifier.toLowerCase()) && 
           u.password === loginPassword
    );

    if (!user) {
      addToast('error', 'Login Gagal', 'Kombinasi NIM/Email atau Kata Sandi salah.');
      return;
    }

    localStorage.setItem('paham_current_user', JSON.stringify(user));
    setCurrentUser(user);
    setIsMentor(user.isMentor);
    setMentorEarnings(user.earnings || 0);
    setUserToken(`local-session-${user.nim}`);

    const bookingsList = JSON.parse(localStorage.getItem('paham_bookings') || '[]');
    const classesList = JSON.parse(localStorage.getItem('paham_classes') || '[]');
    syncClassesWithLocalState(classesList, bookingsList, user);

    addToast('success', 'Selamat Datang Kembali!', `Halo ${user.name}, Anda berhasil masuk.`);
    setActiveView(user.isMentor ? 'mentor-dashboard' : 'mentee-dashboard');
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName || !regNim || !regEmail || !regPassword || !regMajor) {
      addToast('error', 'Registrasi Gagal', 'Harap lengkapi seluruh bidang pendaftaran.');
      return;
    }

    const usersList: UserAccount[] = JSON.parse(localStorage.getItem('paham_users') || '[]');
    const isNimTaken = usersList.some(u => u.nim === regNim);
    const isEmailTaken = usersList.some(u => u.email.toLowerCase() === regEmail.toLowerCase());

    if (isNimTaken) {
      addToast('error', 'Registrasi Gagal', 'NIM sudah terdaftar.');
      return;
    }
    if (isEmailTaken) {
      addToast('error', 'Registrasi Gagal', 'Email sudah terdaftar.');
      return;
    }

    const newUser: UserAccount = {
      name: regName,
      nim: regNim,
      email: regEmail,
      password: regPassword,
      major: regMajor,
      isMentor: false,
      earnings: 0
    };

    const updatedUsers = [...usersList, newUser];
    localStorage.setItem('paham_users', JSON.stringify(updatedUsers));
    localStorage.setItem('paham_current_user', JSON.stringify(newUser));

    setCurrentUser(newUser);
    setIsMentor(false);
    setMentorEarnings(0);
    setUserToken(`local-session-${newUser.nim}`);

    const bookingsList = JSON.parse(localStorage.getItem('paham_bookings') || '[]');
    const classesList = JSON.parse(localStorage.getItem('paham_classes') || '[]');
    syncClassesWithLocalState(classesList, bookingsList, newUser);

    addToast('success', 'Registrasi Berhasil!', 'Akun Anda berhasil didaftarkan.');
    setIsRegisterMode(false);
    setActiveView('mentee-dashboard');
  };

  const handleToggleMentorMode = () => {
    if (!isMentor) {
      setActiveView('mentor-verification');
      addToast('info', 'Verifikasi Mentor', 'Lengkapi formulir verifikasi terlebih dahulu untuk mengaktifkan Mode Mentor.');
    } else {
      if (activeView === 'mentor-dashboard') {
        setActiveView('mentee-dashboard');
        addToast('info', 'Mode Mentee Aktif', 'Sekarang Anda menjelajah sebagai pencari kelas patungan.');
      } else {
        setActiveView('mentor-dashboard');
        addToast('success', 'Mode Mentor Aktif', 'Selamat datang di ruang kerja Mentor Anda.');
      }
    }
  };

  const handleJoinPatungan = (classId: string) => {
    const targetClass = mockClasses.find(c => c.id === classId);
    if (targetClass) {
      if (targetClass.isBooked) {
        addToast('info', 'Sudah Bergabung', 'Anda sudah bergabung dalam kelas ini.');
        return;
      }
      if (targetClass.currentQuota >= targetClass.maxQuota) {
        addToast('error', 'Kuota Penuh', 'Maaf, kuota patungan kelas ini telah penuh.');
        return;
      }
      setSelectedClass(targetClass);
      setShowPaymentModal(true);
    }
  };

  const handleConfirmPayment = () => {
    if (!selectedClass || !currentUser) return;

    const bookingsList: { nim: string; classId: string }[] = JSON.parse(localStorage.getItem('paham_bookings') || '[]');
    const isAlreadyBooked = bookingsList.some(b => b.nim === currentUser.nim && b.classId === selectedClass.id);

    if (isAlreadyBooked) {
      addToast('info', 'Sudah Bergabung', 'Anda sudah bergabung dalam kelas ini.');
      setShowPaymentModal(false);
      setSelectedClass(null);
      return;
    }

    const updatedBookings = [...bookingsList, { nim: currentUser.nim, classId: selectedClass.id }];
    localStorage.setItem('paham_bookings', JSON.stringify(updatedBookings));

    const classesList: MentoringClass[] = JSON.parse(localStorage.getItem('paham_classes') || '[]');
    const targetCls = classesList.find(c => c.id === selectedClass.id);
    if (targetCls) {
      targetCls.currentQuota = Math.min(targetCls.maxQuota, targetCls.currentQuota + 1);
      
      const usersList: UserAccount[] = JSON.parse(localStorage.getItem('paham_users') || '[]');
      const mentorUser = usersList.find(u => u.name === targetCls.mentorName);
      if (mentorUser) {
        mentorUser.earnings = (mentorUser.earnings || 0) + 5000;
        localStorage.setItem('paham_users', JSON.stringify(usersList));
        
        if (currentUser.nim === mentorUser.nim) {
          currentUser.earnings = mentorUser.earnings;
          localStorage.setItem('paham_current_user', JSON.stringify(currentUser));
          setMentorEarnings(mentorUser.earnings);
        }
      }
    }
    localStorage.setItem('paham_classes', JSON.stringify(classesList));

    syncClassesWithLocalState(classesList, updatedBookings, currentUser);
    setShowPaymentModal(false);
    setSelectedClass(null);

    addToast('success', 'Pembayaran Terkonfirmasi', `Selamat! Anda berhasil bergabung dalam kelas "${selectedClass.title}".`);
    setActiveView('mentee-dashboard');
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setUploadedFile({
        name: file.name,
        size: (file.size / (1024 * 1024)).toFixed(2) + ' MB'
      });
      addToast('success', 'Berkas Diupload', `Berhasil memilih ${file.name}`);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadedFile({
        name: file.name,
        size: (file.size / (1024 * 1024)).toFixed(2) + ' MB'
      });
      addToast('success', 'Berkas Diupload', `Berhasil memilih ${file.name}`);
    }
  };

  const simulateVerificationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadedFile || !currentUser) {
      addToast('error', 'Unggah Transkrip', 'Anda harus melampirkan file transkrip nilai KHS.');
      return;
    }

    const usersList: UserAccount[] = JSON.parse(localStorage.getItem('paham_users') || '[]');
    const user = usersList.find(u => u.nim === currentUser.nim);
    if (user) {
      user.isMentor = true;
      localStorage.setItem('paham_users', JSON.stringify(usersList));
      
      currentUser.isMentor = true;
      localStorage.setItem('paham_current_user', JSON.stringify(currentUser));
      
      setIsMentor(true);
      setMentorEarnings(currentUser.earnings || 0);

      addToast('success', 'Verifikasi Berhasil!', 'Selamat! Anda sekarang resmi menjadi Mentor di Paham.in');
      
      const bookingsList = JSON.parse(localStorage.getItem('paham_bookings') || '[]');
      const classesList = JSON.parse(localStorage.getItem('paham_classes') || '[]');
      syncClassesWithLocalState(classesList, bookingsList, currentUser);
      
      setActiveView('mentor-dashboard');
    } else {
      addToast('error', 'Verifikasi Gagal', 'Sesi pengguna tidak valid.');
    }
  };

  const handleCreateClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassTitle || !newClassDescription || !newClassDateTime || !newClassLink) {
      addToast('error', 'Data Belum Lengkap', 'Silakan lengkapi semua bidang isian formulir kelas baru termasuk link kelas.');
      return;
    }
    if (!currentUser) return;

    const newClass: MentoringClass = {
      id: `class-custom-${Date.now()}`,
      title: newClassTitle,
      mentorName: currentUser.name,
      mentorAvatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(currentUser.name)}`,
      mentorMajor: `${currentUser.major || 'S1 Informatika'} - Terverifikasi`,
      mentorRating: 5.0,
      price: 5000,
      currentQuota: 0,
      maxQuota: 10,
      category: newClassCategory,
      description: newClassDescription,
      dateTime: newClassDateTime,
      duration: newClassDuration,
      location: newClassLink.toLowerCase().includes('meet.google.com') 
        ? 'Google Meet' 
        : newClassLink.toLowerCase().includes('whatsapp.com') 
          ? 'Grup WhatsApp' 
          : 'Daring (Link Kustom)',
      classLink: newClassLink,
      materials: ['Slide Materi Buatan Mentor', 'Latihan Mandiri Quiz']
    };

    const classesList: MentoringClass[] = JSON.parse(localStorage.getItem('paham_classes') || '[]');
    const updatedClasses = [newClass, ...classesList];
    localStorage.setItem('paham_classes', JSON.stringify(updatedClasses));

    const bookingsList = JSON.parse(localStorage.getItem('paham_bookings') || '[]');
    syncClassesWithLocalState(updatedClasses, bookingsList, currentUser);

    addToast('success', 'Kelas Berhasil Dibuat!', `Kelas "${newClassTitle}" siap menampung patungan mahasiswa.`);
    setIsCreateClassOpen(false);
    
    setNewClassTitle('');
    setNewClassDescription('');
    setNewClassDateTime('');
    setNewClassLink('');
  };

  const handleWithdrawFunds = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseInt(withdrawAmount, 10);
    if (isNaN(amount) || amount <= 0) {
      addToast('error', 'Nominal Salah', 'Harap masukkan nominal dana yang valid.');
      return;
    }
    if (amount > mentorEarnings) {
      addToast('error', 'Dana Tidak Cukup', 'Saldo pendapatan Anda tidak mencukupi untuk penarikan ini.');
      return;
    }
    if (!currentUser) return;

    const usersList: UserAccount[] = JSON.parse(localStorage.getItem('paham_users') || '[]');
    const user = usersList.find(u => u.nim === currentUser.nim);
    if (user) {
      user.earnings = (user.earnings || 0) - amount;
      localStorage.setItem('paham_users', JSON.stringify(usersList));

      currentUser.earnings = user.earnings;
      localStorage.setItem('paham_current_user', JSON.stringify(currentUser));
      setMentorEarnings(user.earnings);

      addToast('success', 'Penarikan Diproses', `Dana Rp ${amount.toLocaleString('id-ID')} berhasil ditarik ke ${withdrawChannel}. Proses kirim maksimal 1x24 jam.`);
      setIsWithdrawOpen(false);
    } else {
      addToast('error', 'Penarikan Gagal', 'Sesi pengguna tidak valid.');
    }
  };

  const handleLogoutAction = () => {
    localStorage.removeItem('paham_current_user');
    setCurrentUser(null);
    setIsMentor(false);
    setUploadedFile(null);
    setSearchQuery('');
    setCategoryFilter('Semua');
    setMentorEarnings(0);
    setUserToken(null);

    const classesList = JSON.parse(localStorage.getItem('paham_classes') || '[]');
    const bookingsList = JSON.parse(localStorage.getItem('paham_bookings') || '[]');
    syncClassesWithLocalState(classesList, bookingsList, null);

    addToast('info', 'Sesi Berakhir', 'Anda telah berhasil keluar dari akun Paham.in');
    setActiveView('login');
  };

  // ============================================================================
  // RENDER SECTIONS
  // ============================================================================

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans relative overflow-x-hidden antialiased flex flex-col">
      
      {/* Toast Notification Container */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className={`p-4 rounded-xl shadow-lg border flex items-start gap-3 backdrop-blur-md ${
                toast.type === 'success' 
                  ? 'bg-emerald-50/95 border-emerald-200 text-emerald-900' 
                  : toast.type === 'error'
                  ? 'bg-rose-50/95 border-rose-200 text-rose-900'
                  : 'bg-blue-50/95 border-blue-200 text-blue-900'
              }`}
            >
              {toast.type === 'success' && <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />}
              {toast.type === 'error' && <X className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />}
              {toast.type === 'info' && <Sparkles className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />}
              
              <div className="flex-1">
                <h4 className="font-semibold text-sm leading-tight">{toast.title}</h4>
                <p className="text-xs mt-1 text-gray-600 leading-relaxed">{toast.message}</p>
              </div>
              <button onClick={() => setToasts(t => t.filter(x => x.id !== toast.id))} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Google Sign-In Profile Completion Modal */}
      {showGoogleRegisterModal && pendingGoogleUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-gray-100 overflow-hidden transform transition-all">
            <div className="bg-orange-50 border-b border-orange-100 p-6">
              <h3 className="text-xl font-bold text-neutral-900">Lengkapi Profil Mahasiswa</h3>
              <p className="text-orange-700 text-xs mt-1">Satu langkah lagi untuk menghubungkan akun Google Anda dengan Paham.in</p>
            </div>
            
            <form onSubmit={handleGoogleRegisterSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Nama dari Google</label>
                <div className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm text-gray-700 font-medium">
                  {pendingGoogleUser.name}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Email dari Google</label>
                <div className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm text-gray-600">
                  {pendingGoogleUser.email}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">NIM Mahasiswa</label>
                <input 
                  type="text" 
                  required
                  value={googleRegNim}
                  onChange={(e) => setGoogleRegNim(e.target.value)}
                  placeholder="Masukkan NIM Anda (Contoh: 240601)"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-gray-800 animate-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Program Studi</label>
                <select 
                  value={googleRegMajor}
                  onChange={(e) => setGoogleRegMajor(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-gray-800"
                >
                  <option value="Teknik Informatika">Teknik Informatika</option>
                  <option value="Sistem Informasi">Sistem Informasi</option>
                  <option value="Kimia">Kimia</option>
                  <option value="Fisika">Fisika</option>
                  <option value="Teknik Tambang">Teknik Tambang</option>
                  <option value="Agribisnis">Agribisnis</option>
                  <option value="Matematika">Matematika</option>
                </select>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={handleCancelGoogleRegister}
                  className="flex-1 border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold py-3 rounded-xl text-sm transition-all cursor-pointer text-center"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-lg hover:shadow-blue-500/20 text-sm transition-all cursor-pointer text-center"
                >
                  Selesaikan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={activeView}
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.28, ease: [0.25, 0.1, 0.25, 1] }}
        className="flex flex-1 flex-col"
      >
      {activeView === 'login' ? (
        // ====================================================================
        // LOGIN & REGISTRATION VIEW (STUDENT-SPECIFIC)
        // ====================================================================
        <div id="login-screen" className="flex-1 flex items-center justify-center p-4 md:p-10 bg-[#FAFAFA] min-h-screen relative overflow-hidden">
          {/* Decorative light accents */}
          <div className="absolute top-[-120px] right-[-60px] w-[28rem] h-[28rem] bg-orange-100/70 rounded-full blur-3xl"></div>
          <div className="absolute bottom-[-140px] left-[-60px] w-[30rem] h-[30rem] bg-neutral-200/60 rounded-full blur-3xl"></div>

          <div className="relative z-10 w-full max-w-7xl bg-white rounded-[2rem] border border-neutral-200/80 shadow-[0_32px_90px_-32px_rgba(23,23,23,0.25)] overflow-hidden grid lg:grid-cols-[1.35fr_1fr]">
            
            {/* Left Brand Panel */}
            <div className="bg-[#FAFAFA] border-b lg:border-b-0 lg:border-r border-neutral-200/80 p-8 md:p-12 xl:p-14 flex flex-col justify-between gap-10 relative overflow-hidden">
              <div className="absolute -top-20 -right-20 w-72 h-72 bg-orange-100/80 rounded-full blur-3xl"></div>
              <div className="absolute -bottom-24 -left-16 w-64 h-64 bg-orange-100/40 rounded-full blur-3xl"></div>
              
              {/* Logo */}
              <div className="relative z-10 flex items-center gap-3">
                <div className="bg-neutral-900 text-amber-400 p-3 rounded-2xl shadow-sm flex items-center justify-center">
                  <BookOpen className="w-7 h-7 stroke-[2.5]" />
                </div>
                <div>
                  <span className="text-[1.7rem] font-extrabold tracking-tight text-neutral-900 leading-none">Paham<span className="text-orange-600">.in</span></span>
                  <span className="block text-[10px] uppercase tracking-widest text-neutral-400 font-semibold mt-1">Micro-Class Crowdfunding</span>
                </div>
              </div>

              {/* Big display hero */}
              <div className="relative z-10 space-y-6">
                <div className="inline-flex items-center gap-2 bg-orange-50 border border-orange-100 text-orange-700 text-xs font-semibold py-1.5 px-3.5 rounded-full">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Pelopor Belajar Patungan Mahasiswa</span>
                </div>
                <h1 className="text-4xl xl:text-6xl font-extrabold tracking-tight leading-[1.05] text-neutral-900">
                  Belajar
                  <span className="block">bareng.</span>
                  <span className="block text-orange-600">Bayar bareng.</span>
                </h1>
                <p className="text-neutral-500 text-base md:text-lg leading-relaxed max-w-md">
                  Satu sesi mentoring dibayar patungan <span className="text-orange-700 font-bold">Rp 5.000</span> per kepala. Kelas jalan saat kursinya terisi — belajar langsung dari mahasiswa berprestasi yang sudah paham materinya.
                </p>

                {/* Signature: patungan meter */}
                <div className="pt-2">
                  <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 max-w-md">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Cara kerja satu kelas</span>
                      <span className="bg-orange-100 text-orange-700 text-[10px] font-bold px-2 py-0.5 rounded-full">8/10 Terisi</span>
                    </div>
                    <div className="flex items-center gap-1.5 mb-3">
                      {[0,1,2,3,4,5,6,7].map(i => (
                        <div key={i} className="h-2.5 flex-1 bg-orange-500 rounded-full"></div>
                      ))}
                      {[0,1].map(i => (
                        <div key={i} className="h-2.5 flex-1 bg-neutral-100 rounded-full border border-neutral-200"></div>
                      ))}
                    </div>
                    <p className="text-xs text-neutral-500 leading-relaxed">
                      8 dari 10 mahasiswa sudah patungan. Begitu penuh, kelas <span className="font-semibold text-neutral-900">dikunci</span> dan mentor siap mengajar.
                    </p>
                  </div>
                </div>
              </div>

              {/* Trust row */}
              <div className="relative z-10 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-neutral-500 border-t border-neutral-200/80 pt-6">
                <span className="flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-orange-700" />
                  Patungan flat Rp 5.000
                </span>
                <span className="flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-orange-700" />
                  Mentor verifikasi KHS
                </span>
              </div>
            </div>

            {/* Right Form Panel */}
            <div className="bg-white p-8 md:p-12 xl:p-14 flex items-center justify-center">
              <div className="w-full max-w-[26rem]">
              {!isRegisterMode ? (
                // ==================== LOGIN FORM ====================
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Masuk untuk belajar bareng</h2>
                    <p className="text-gray-500 text-sm mt-1">Gunakan NIM atau email kampus untuk melanjutkan.</p>
                  </div>

                  <form onSubmit={handleLogin} className="space-y-5">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">NIM / Email Kampus</label>
                      <div className="relative">
                        <input 
                          type="text" 
                          value={loginIdentifier}
                          onChange={(e) => setLoginIdentifier(e.target.value)}
                          placeholder="Masukkan NIM atau email@university.edu"
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 pl-11 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-gray-800"
                        />
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                          <User className="w-4 h-4" />
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500">Kata Sandi</label>
                      </div>
                      <div className="relative">
                        <input 
                          type="password" 
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 pl-11 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-gray-800"
                        />
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                          <Lock className="w-4 h-4" />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 py-1">
                      <input type="checkbox" id="remember" className="rounded text-blue-600 focus:ring-blue-500" defaultChecked />
                      <label htmlFor="remember" className="text-xs text-gray-500 select-none">Ingat akun saya di perangkat ini</label>
                    </div>

                    <button 
                      type="submit"
                      id="btn-masuk"
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-lg hover:shadow-blue-500/20 transform hover:-translate-y-0.5 active:translate-y-0 transition-all text-sm flex items-center justify-center gap-2 cursor-pointer font-sans"
                    >
                      <span>Masuk</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </form>

                  <div className="relative flex py-2 items-center">
                    <div className="flex-grow border-t border-gray-100"></div>
                    <span className="flex-shrink mx-4 text-gray-400 text-xs uppercase font-semibold">Atau masuk dengan</span>
                    <div className="flex-grow border-t border-gray-100"></div>
                  </div>

                  <button 
                    type="button"
                    onClick={handleGoogleSignIn}
                    className="w-full bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 font-semibold py-3 rounded-xl shadow-sm transform hover:-translate-y-0.5 active:translate-y-0 transition-all text-sm flex items-center justify-center gap-2 cursor-pointer font-sans"
                  >
                    <svg className="w-4 h-4 mr-1 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                    </svg>
                    <span>Masuk dengan Google</span>
                  </button>

                  <div className="pt-4 text-center border-t border-gray-100">
                    <p className="text-xs text-gray-500">
                      Belum punya akun?{' '}
                      <button 
                        onClick={() => setIsRegisterMode(true)}
                        className="text-orange-700 font-bold hover:underline cursor-pointer font-sans"
                      >
                        Daftar di sini
                      </button>
                    </p>
                  </div>
                </div>
              ) : (
                // ==================== REGISTER FORM ====================
                <div className="space-y-5">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Daftar akun baru</h2>
                    <p className="text-gray-500 text-sm mt-1">Data mahasiswa dipakai untuk verifikasi dan kelas patungan.</p>
                  </div>

                  <form onSubmit={handleRegister} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Nama Lengkap</label>
                      <input 
                        type="text" 
                        required
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        placeholder="Contoh: Afif Prasetyo"
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-gray-800"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">NIM Mahasiswa</label>
                        <input 
                          type="text" 
                          required
                          value={regNim}
                          onChange={(e) => setRegNim(e.target.value)}
                          placeholder="Contoh: 240601"
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-gray-800"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Program Studi</label>
                        <select 
                          value={regMajor}
                          onChange={(e) => setRegMajor(e.target.value)}
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-gray-800"
                        >
                          <option value="Teknik Informatika">Teknik Informatika</option>
                          <option value="Sistem Informasi">Sistem Informasi</option>
                          <option value="Kimia">Kimia</option>
                          <option value="Fisika">Fisika</option>
                          <option value="Teknik Tambang">Teknik Tambang</option>
                          <option value="Agribisnis">Agribisnis</option>
                          <option value="Matematika">Matematika</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Email Kampus</label>
                      <input 
                        type="email" 
                        required
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="email_anda@university.edu"
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-gray-800"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Kata Sandi</label>
                      <input 
                        type="password" 
                        required
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="Minimal 6 karakter"
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-gray-800"
                      />
                    </div>

                    <button 
                      type="submit"
                      className="w-full bg-orange-500 hover:bg-orange-400 text-neutral-900 font-bold py-3.5 rounded-xl shadow-lg hover:shadow-orange-500/20 transform hover:-translate-y-0.5 active:translate-y-0 transition-all text-sm flex items-center justify-center gap-2 cursor-pointer font-sans"
                    >
                      <span>Daftar</span>
                      <CheckCircle className="w-4 h-4" />
                    </button>
                  </form>

                  <div className="relative flex py-2 items-center">
                    <div className="flex-grow border-t border-gray-100"></div>
                    <span className="flex-shrink mx-4 text-gray-400 text-xs uppercase font-semibold">Atau daftar dengan</span>
                    <div className="flex-grow border-t border-gray-100"></div>
                  </div>

                  <button 
                    type="button"
                    onClick={handleGoogleSignIn}
                    className="w-full bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 font-semibold py-3 rounded-xl shadow-sm transform hover:-translate-y-0.5 active:translate-y-0 transition-all text-sm flex items-center justify-center gap-2 cursor-pointer font-sans"
                  >
                    <svg className="w-4 h-4 mr-1 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                    </svg>
                    <span>Daftar dengan Google</span>
                  </button>

                  <div className="pt-4 text-center border-t border-gray-100">
                    <p className="text-xs text-gray-500">
                      Sudah punya akun?{' '}
                      <button 
                        onClick={() => setIsRegisterMode(false)}
                        className="text-blue-600 font-bold hover:underline cursor-pointer font-sans"
                      >
                        Masuk di sini
                      </button>
                    </p>
                  </div>
                </div>
              )}
              </div>
            </div>

          </div>
        </div>
      ) : (
        // ====================================================================
        // SHELL WITH 2-COLUMN LAYOUT (SIDEBAR + MAIN CONTENT)
        // ====================================================================
        <div className="flex-1 flex flex-col md:flex-row items-stretch">
          
          {/* Mobile Navigation Header */}
          <header className="md:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-40">
            <div className="flex items-center gap-2">
              <div className="bg-blue-600 text-white p-1.5 rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 stroke-[2.5]" />
              </div>
              <span className="font-bold text-lg text-gray-900">Paham<span className="text-orange-700">.in</span></span>
            </div>
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600"
            >
              <Menu className="w-6 h-6" />
            </button>
          </header>

          {/* Sidebar Drawer Overlays (for mobile) */}
          <AnimatePresence>
            {sidebarOpen && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSidebarOpen(false)}
                className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden"
              />
            )}
          </AnimatePresence>

          {/* LEFT SIDEBAR (20% Desktop) */}
          <aside id="sidebar" className={`
            w-72 md:w-[22%] bg-white border-r border-gray-200 flex flex-col justify-between 
            fixed md:sticky top-[53px] md:top-0 h-[calc(100vh-53px)] md:h-screen z-40 transition-transform duration-300
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          `}>
            {/* Top Logo and Navigation Area */}
            <div className="p-6 overflow-y-auto flex-1 flex flex-col">
              {/* Logo (Desktop Only) */}
              <div className="hidden md:flex items-center gap-2.5 mb-8">
                <div className="bg-blue-600 text-white p-2.5 rounded-xl shadow-md flex items-center justify-center">
                  <BookOpen className="w-6 h-6 stroke-[2.5]" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 tracking-tight leading-none">Paham<span className="text-orange-700">.in</span></h2>
                  <span className="text-[10px] text-gray-400 font-semibold tracking-wider uppercase mt-1 block">Patungan Mentoring</span>
                </div>
              </div>

              {/* Navigation Menu */}
              <nav className="space-y-1.5 flex-1">
                <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 px-3">MENU UTAMA</span>
                
                <button
                  onClick={() => {
                    setActiveView(isMentor && activeView === 'mentor-dashboard' ? 'mentor-dashboard' : 'mentee-dashboard');
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                    activeView === 'mentee-dashboard' || activeView === 'mentor-dashboard'
                      ? 'bg-blue-50 text-blue-700 font-bold'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <BookOpen className={`w-4 h-4 ${activeView === 'mentee-dashboard' || activeView === 'mentor-dashboard' ? 'text-blue-600' : 'text-gray-400'}`} />
                  <span>Beranda</span>
                </button>

                <button
                  onClick={() => {
                    setActiveView('schedule');
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                    activeView === 'schedule'
                      ? 'bg-blue-50 text-blue-700 font-bold'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Calendar className={`w-4 h-4 ${activeView === 'schedule' ? 'text-blue-600' : 'text-gray-400'}`} />
                  <span>Jadwal Saya</span>
                  {statistics.joinedCount > 0 && (
                    <span className="ml-auto bg-orange-500 text-neutral-900 text-[10px] font-bold h-5 w-5 rounded-full flex items-center justify-center">
                      {statistics.joinedCount}
                    </span>
                  )}
                </button>

                <div className="pt-6 mt-6 border-t border-gray-100">
                  <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 px-3">BANTUAN & INFO</span>
                  <a 
                    href="#" 
                    onClick={(e) => { e.preventDefault(); addToast('info', 'Model Bisnis Patungan', 'Setiap kelas berharga Rp 5.000 per mahasiswa. Kelas berjalan jika sudah mencapai kuota minimum (biasanya 5-10 mahasiswa).'); }}
                    className="flex items-center gap-3 px-3 py-2 text-xs text-gray-500 hover:text-gray-800"
                  >
                    <HelpCircle className="w-4 h-4 text-gray-400" />
                    <span>Cara Kerja Patungan</span>
                  </a>
                  <a 
                    href="#" 
                    onClick={(e) => { e.preventDefault(); addToast('info', 'KHS Terverifikasi', 'Seluruh mentor wajib mengunggah KHS resmi dengan IPK >= 3.5 pada mata kuliah yang diajarkan.'); }}
                    className="flex items-center gap-3 px-3 py-2 text-xs text-gray-500 hover:text-gray-800"
                  >
                    <Shield className="w-4 h-4 text-gray-400" />
                    <span>Jaminan Keamanan Mentor</span>
                  </a>
                </div>
              </nav>
            </div>

            {/* Bottom Profile Panel */}
            <div className="p-4 border-t border-gray-100 bg-gray-50/50 space-y-4">
              
              {/* Profile Card Info */}
              <div className="flex items-center gap-3 px-2">
                <div className="relative">
                  <img 
                    src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(currentUser?.name || 'M')}`} 
                    alt={currentUser?.name || 'User'} 
                    className="w-10 h-10 rounded-xl object-cover ring-2 ring-blue-100"
                  />
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-gray-900 truncate">{currentUser?.name || 'Mahasiswa'}</h4>
                  <p className="text-[10px] text-gray-500 truncate">{currentUser?.major || 'S1 Informatika'} • NIM {currentUser?.nim || '12345'}</p>
                </div>
                <button 
                  onClick={handleLogoutAction}
                  title="Keluar Akun"
                  aria-label="Keluar dari akun"
                  className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-200 hover:text-gray-700"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>

              {/* Mentor Mode Toggle Card */}
              <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-blue-600" />
                    <span className="text-xs font-bold text-gray-700">Mode Mentor</span>
                  </div>
                  {isMentor ? (
                    <span className="bg-emerald-100 text-emerald-800 text-[9px] font-bold px-1.5 py-0.5 rounded-full">AKTIF</span>
                  ) : (
                    <span className="bg-gray-100 text-gray-600 text-[9px] font-bold px-1.5 py-0.5 rounded-full">BELUM</span>
                  )}
                </div>
                <p className="text-[10px] text-gray-400 leading-tight mb-2.5">
                  {isMentor ? 'Aktifkan untuk mengelola kelas & penarikan dana mengajar.' : 'Daftar sebagai mentor untuk mendapatkan penghasilan tambahan.'}
                </p>
                
                <button
                  onClick={handleToggleMentorMode}
                  className={`w-full py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    isMentor 
                      ? activeView === 'mentor-dashboard'
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-orange-500 hover:bg-orange-400 text-neutral-900'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200'
                  }`}
                >
                  {isMentor ? (
                    activeView === 'mentor-dashboard' ? (
                      <>
                        <span>Masuk Mode Mentee</span>
                        <ChevronRight className="w-3 h-3" />
                      </>
                    ) : (
                      <>
                        <span>Masuk Mode Mentor</span>
                        <Sparkles className="w-3.5 h-3.5" />
                      </>
                    )
                  ) : (
                    <>
                      <span>Mulai Verifikasi</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>

            </div>
          </aside>

          {/* RIGHT MAIN CONTENT AREA (80% Desktop) */}
          <main className="flex-1 bg-gray-50 flex flex-col min-h-[calc(100vh-53px)] md:min-h-screen">
            
            {/* Top Stat Bar/Breadcrumbs in Main layout */}
            <div className="bg-white border-b border-gray-200 px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <span className="text-xs text-orange-700 font-bold uppercase tracking-wider">Universitas Student Hub</span>
                <h1 className="text-lg font-bold text-gray-900 mt-0.5">
                  {activeView === 'mentee-dashboard' && 'Beranda Mentee'}
                  {activeView === 'class-detail' && 'Detail Patungan Kelas'}
                  {activeView === 'mentor-verification' && 'Pendaftaran Verifikasi Mentor'}
                  {activeView === 'mentor-dashboard' && 'Studio Mentor'}
                  {activeView === 'schedule' && 'Jadwal Kuliah Patungan'}
                </h1>
              </div>

              {/* Dynamic Badges / Stats depending on user status */}
              <div className="flex items-center gap-3">
                <div className="bg-gray-50 rounded-xl px-3.5 py-2 border border-gray-100 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-blue-600" />
                  <div className="text-xs">
                    <span className="text-gray-400 block text-[9px] uppercase font-bold">Patungan Aktif</span>
                    <span className="font-bold text-gray-800">{statistics.joinedCount} Kelas</span>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl px-3.5 py-2 border border-gray-100 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-orange-700" />
                  <div className="text-xs">
                    <span className="text-gray-400 block text-[9px] uppercase font-bold">Tarif Kelas</span>
                    <span className="font-bold text-gray-800">Rp 5.000 <span className="text-[10px] font-normal text-gray-500">/sesi</span></span>
                  </div>
                </div>
              </div>
            </div>

            {/* Inner Dashboard View Content */}
            <div className="p-6 flex-1 flex flex-col">
              
              {activeView === 'mentee-dashboard' && (
                // ============================================================
                // MENTEE DASHBOARD VIEW
                // ============================================================
                <div id="mentee-dashboard-view" className="space-y-6 flex-1 flex flex-col">
                  
                  {/* Top Notification Banner */}
                  <div className="bg-orange-50 border border-orange-100 rounded-2xl p-6 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="absolute top-0 right-0 w-80 h-80 bg-orange-100/70 rounded-full -mr-20 -mt-20 blur-2xl"></div>
                    <div className="relative z-10 max-w-xl">
                      <div className="bg-orange-500 text-neutral-900 text-[10px] font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 mb-2.5">
                        <Sparkles className="w-3 h-3" />
                        <span>SISTEM CROWDFUNDING</span>
                      </div>
                      <h3 className="text-xl font-extrabold tracking-tight text-neutral-900">
                        {isMentor 
                          ? "Anda Adalah Mentor Resmi Paham.in!" 
                          : "Ingin Jadi Mentor? Daftar Sekarang!"
                        }
                      </h3>
                      <p className="text-neutral-500 text-sm mt-1.5 leading-relaxed">
                        {isMentor
                          ? "Ajarkan materi keahlian Anda, kumpulkan patungan mahasiswa, dan dapatkan penghasilan mengajar langsung ke rekening Anda."
                          : "Bantu adik tingkat memahami materi kuliah yang sudah Anda kuasai. Dapatkan penghasilan tambahan hingga puluhan ribu per jam dengan membagikan KHS Anda!"
                        }
                      </p>
                    </div>
                    <div className="relative z-10 shrink-0">
                      {isMentor ? (
                        <button
                          onClick={() => setActiveView('mentor-dashboard')}
                          className="bg-white border border-neutral-200 text-neutral-900 hover:bg-neutral-50 font-bold px-5 py-2.5 rounded-xl text-sm shadow-sm transition-all flex items-center gap-2 cursor-pointer"
                        >
                          <span>Kunjungi Studio Mentor</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => setActiveView('mentor-verification')}
                          className="bg-orange-500 hover:bg-orange-400 text-neutral-900 font-bold px-5 py-2.5 rounded-xl text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer"
                        >
                          <span>Daftar Mentor</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Filter and Search Bar */}
                  <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    
                    {/* Categories Pills */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-2 lg:pb-0 scrollbar-none">
                      {CATEGORIES.map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setCategoryFilter(cat)}
                          className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                            categoryFilter === cat
                              ? 'bg-blue-600 text-white shadow-md'
                              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>

                    {/* Search Input */}
                    <div className="relative max-w-sm w-full">
                      <input
                        type="text"
                        placeholder="Cari kelas, materi, atau mentor..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 pl-10 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-gray-800"
                      />
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      {searchQuery && (
                        <button 
                          onClick={() => setSearchQuery('')}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                  </div>

                  {/* Search Results / Header Grid */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">
                        {categoryFilter === 'Semua' ? 'Seluruh Kelas Aktif' : `Kelas Kategori: ${categoryFilter}`}
                        {searchQuery && ` (Hasil pencarian untuk "${searchQuery}")`}
                      </h4>
                      <span className="text-xs text-gray-500 font-semibold">{filteredClasses.length} Kelas Tersedia</span>
                    </div>

                    {filteredClasses.length === 0 ? (
                      <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center max-w-xl mx-auto my-8">
                        <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100">
                          <BookOpen className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">Kelas Tidak Ditemukan</h3>
                        <p className="text-sm text-gray-500 mt-2">Maaf, kami tidak dapat menemukan kelas yang cocok dengan kriteria pencarian Anda. Coba ubah filter kategori atau kata kunci pencarian Anda.</p>
                        <button 
                          onClick={() => { setSearchQuery(''); setCategoryFilter('Semua'); }}
                          className="mt-5 bg-blue-600 text-white font-bold px-4 py-2 rounded-xl text-xs"
                        >
                          Reset Filter & Pencarian
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredClasses.map((item) => {
                          const quotaPercent = (item.currentQuota / item.maxQuota) * 100;
                          const isFull = item.currentQuota >= item.maxQuota;
                          
                          return (
                            <div 
                              key={item.id}
                              id={`class-card-${item.id}`}
                              onClick={() => {
                                setSelectedClass(item);
                                setActiveView('class-detail');
                              }}
                              className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg hover:scale-[1.01] transition-all duration-300 cursor-pointer flex flex-col justify-between group"
                            >
                              {/* Card Header & Category Badge */}
                              <div className="p-5 flex-1">
                                <div className="flex items-center justify-between gap-2 mb-3.5">
                                  <span className={`text-[10px] font-extrabold tracking-wider uppercase px-2.5 py-1 rounded-full border ${
                                    item.category === 'Informatika' 
                                      ? 'bg-blue-50 text-blue-700 border-blue-100' 
                                      : item.category === 'Manajemen'
                                      ? 'bg-amber-50 text-amber-700 border-amber-100'
                                      : item.category === 'Kedokteran'
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                      : 'bg-purple-50 text-purple-700 border-purple-100'
                                  }`}>
                                    {item.category}
                                  </span>

                                  <div className="flex items-center gap-1 bg-yellow-50 text-yellow-700 text-xs px-2 py-0.5 rounded-lg font-bold">
                                    <span>★</span>
                                    <span>{item.mentorRating}</span>
                                  </div>
                                </div>

                                <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors leading-snug line-clamp-2 mb-3">
                                  {item.title}
                                </h3>

                                <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed mb-4">
                                  {item.description}
                                </p>

                                {/* Mentor Card Info */}
                                <div className="flex items-center gap-3 border-t border-gray-50 pt-3.5">
                                  <img 
                                    src={item.mentorAvatar} 
                                    alt={item.mentorName} 
                                    className="w-8 h-8 rounded-full object-cover ring-2 ring-gray-100"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <span className="block text-xs font-bold text-gray-800 truncate">{item.mentorName}</span>
                                    <span className="block text-[10px] text-gray-400 truncate">{item.mentorMajor}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Card Footer (Price & Quota) */}
                              <div className="bg-gray-50 px-5 py-4 border-t border-gray-100 flex flex-col gap-3.5">
                                {/* Quota Progress Bar */}
                                <div>
                                  <div className="flex items-center justify-between text-[10px] text-gray-500 font-bold mb-1.5">
                                    <span className="flex items-center gap-1.5">
                                      <Users className="w-3.5 h-3.5 text-gray-400" />
                                      <span>Kuota Patungan</span>
                                    </span>
                                    <span className={isFull ? 'text-rose-600' : 'text-blue-700'}>
                                      {item.currentQuota}/{item.maxQuota} Mahasiswa
                                    </span>
                                  </div>
                                  <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                    <div 
                                      className={`h-full rounded-full transition-all duration-500 ${
                                        isFull ? 'bg-rose-500' : quotaPercent >= 80 ? 'bg-amber-500' : 'bg-blue-600'
                                      }`}
                                      style={{ width: `${quotaPercent}%` }}
                                    ></div>
                                  </div>
                                </div>

                                {/* Price Tags & Action indicator */}
                                <div className="flex items-center justify-between">
                                  <div>
                                    <span className="block text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-none">BIAYA PATUNGAN</span>
                                    <span className="text-base font-extrabold text-orange-700">Rp 5.000 <span className="text-[10px] text-gray-400 font-medium">/ mhs</span></span>
                                  </div>

                                  <div className="flex items-center gap-1 text-xs text-blue-600 font-bold group-hover:translate-x-1 transition-transform">
                                    <span>{item.isBooked ? 'Terdaftar' : 'Ikut Patung'}</span>
                                    {item.isBooked ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <ChevronRight className="w-4 h-4" />}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                </div>
              )}

              {activeView === 'class-detail' && selectedClass && (
                // ============================================================
                // CLASS DETAIL VIEW
                // ============================================================
                <div id="class-detail-view" className="space-y-6 flex-1 flex flex-col">
                  {/* Back Navigation Bar */}
                  <div>
                    <button 
                      onClick={() => setActiveView('mentee-dashboard')}
                      className="inline-flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-blue-600 transition-colors cursor-pointer"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Kembali ke Jelajah Kelas</span>
                    </button>
                  </div>

                  {/* 2-Column Details Layout */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                    
                    {/* Left Detail Column (2/3 width) */}
                    <div className="lg:col-span-2 space-y-6">
                      
                      {/* Main Course Info Header */}
                      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                        <div className="flex items-center gap-2">
                          <span className="bg-blue-50 text-blue-700 text-xs font-bold px-3 py-1 rounded-full border border-blue-100">
                            {selectedClass.category}
                          </span>
                          <div className="flex items-center gap-1 bg-yellow-50 text-yellow-700 text-xs px-2.5 py-0.5 rounded-lg font-bold">
                            <span>★</span>
                            <span>{selectedClass.mentorRating}</span>
                          </div>
                        </div>

                        <h2 className="text-2xl font-bold text-gray-900 tracking-tight leading-snug">
                          {selectedClass.title}
                        </h2>

                        <p className="text-sm text-gray-600 leading-relaxed">
                          {selectedClass.description}
                        </p>

                        {/* Schedule & Place summary */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-b border-gray-50 py-4 mt-2">
                          <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                              <Calendar className="w-5 h-5" />
                            </div>
                            <div className="text-xs">
                              <span className="block text-gray-400 font-bold uppercase tracking-wider text-[9px]">Jadwal Kelas</span>
                              <span className="font-bold text-gray-800">{selectedClass.dateTime}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                              <Clock className="w-5 h-5" />
                            </div>
                            <div className="text-xs">
                              <span className="block text-gray-400 font-bold uppercase tracking-wider text-[9px]">Durasi Belajar</span>
                              <span className="font-bold text-gray-800">{selectedClass.duration} (Plus tanya jawab)</span>
                            </div>
                          </div>
                        </div>

                        {/* Location / Medium details */}
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <Video className="w-4 h-4 text-gray-400 shrink-0" />
                          <span>Diselenggarakan secara daring via <span className="font-bold text-gray-800">{selectedClass.location}</span></span>
                        </div>
                      </div>

                      {/* Mentor Deep Profile */}
                      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                        <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wider text-gray-400">Profil Mentor Pengajar</h3>
                        
                        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
                          <img 
                            src={selectedClass.mentorAvatar} 
                            alt={selectedClass.mentorName} 
                            className="w-16 h-16 rounded-2xl object-cover ring-4 ring-blue-50"
                          />
                          <div className="space-y-1">
                            <h4 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                              <span>{selectedClass.mentorName}</span>
                              <CheckCircle className="w-4 h-4 text-blue-600 fill-blue-50" />
                            </h4>
                            <p className="text-xs text-blue-700 font-medium">{selectedClass.mentorMajor}</p>
                            <div className="flex items-center gap-4 text-xs text-gray-500 pt-1">
                              <span>★ 4.9 Rating Rata-rata</span>
                              <span>•</span>
                              <span>Telah Mengajar 12+ Sesi</span>
                            </div>
                          </div>
                        </div>

                        <p className="text-xs text-gray-500 leading-relaxed bg-gray-50 p-4 rounded-xl border border-gray-100">
                          "Halo! Saya {selectedClass.mentorName}, mahasiswa aktif yang berfokus mendalami materi mata kuliah ini. Melalui platform Paham.in, saya ingin membantu rekan-rekan memahami konsep tersulit dengan bahasa mahasiswa yang santai, praktis, dan langsung tertuju pada poin ujian!"
                        </p>
                      </div>

                      {/* Syllabus & Materials */}
                      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                        <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wider text-gray-400">Materi & Berkas Pembelajaran</h3>
                        
                        <ul className="space-y-2.5">
                          {selectedClass.materials.map((mat, i) => (
                            <li key={i} className="flex items-start gap-3 text-xs text-gray-600 bg-gray-50/50 p-3 rounded-xl border border-gray-100">
                              <div className="p-1 bg-blue-100 text-blue-700 rounded-md mt-0.5 shrink-0 font-bold">
                                {i + 1}
                              </div>
                              <div className="space-y-0.5">
                                <span className="font-bold text-gray-800 block">{mat}</span>
                                <span className="text-gray-400 text-[10px]">Tersedia dalam format unduhan digital</span>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>

                    </div>

                    {/* Right Payment Column (1/3 width) */}
                    <div className="lg:col-span-1 space-y-6">
                      
                      {/* Booking card */}
                      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-lg space-y-6 sticky top-6">
                        <div>
                          <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">TOTAL BAYAR PATUNGAN</span>
                          <span className="text-3xl font-extrabold text-orange-700 block">Rp 5.000 <span className="text-xs text-gray-400 font-medium">/ mahasiswa</span></span>
                          <span className="text-[10px] text-gray-500 mt-1 block">Biaya flat untuk satu sesi utuh tanpa biaya tersembunyi</span>
                        </div>

                        {/* Quota Progress widget */}
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-2.5">
                          <div className="flex justify-between items-center text-xs font-bold text-gray-700">
                            <span>Status Pengumpulan</span>
                            <span className="text-blue-700">{selectedClass.currentQuota} dari {selectedClass.maxQuota} Terkumpul</span>
                          </div>

                          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-blue-600 rounded-full transition-all duration-500"
                              style={{ width: `${(selectedClass.currentQuota / selectedClass.maxQuota) * 100}%` }}
                            ></div>
                          </div>

                          <p className="text-[10px] text-gray-400 leading-tight">
                            *Kelas akan dijalankan otomatis begitu mencapai kuota minimal. Jika dibatalkan, dana patungan Anda dijamin kembali 100%.
                          </p>
                        </div>

                        {/* List of joined avatars simulator */}
                        <div>
                          <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">MAHASISWA BERGABUNG</span>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {Array.from({ length: selectedClass.currentQuota }).map((_, idx) => (
                              <img 
                                key={idx}
                                src={`https://images.unsplash.com/photo-${1500000000000 + (idx * 500000)}?auto=format&fit=crop&q=80&w=100`}
                                alt="Student Joined"
                                className="w-7 h-7 rounded-full border border-white ring-2 ring-gray-100 object-cover"
                                onError={(e) => {
                                  // Fallback generic avatars
                                  e.currentTarget.src = `https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100`;
                                }}
                              />
                            ))}
                            {selectedClass.currentQuota < selectedClass.maxQuota && (
                              <div className="h-7 w-7 rounded-full bg-blue-50 border border-blue-200 border-dashed text-blue-600 flex items-center justify-center text-[10px] font-bold">
                                +{selectedClass.maxQuota - selectedClass.currentQuota}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Main CTA */}
                        {selectedClass.isBooked ? (
                          <div className="space-y-3">
                            <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl p-3 text-center text-xs font-bold flex items-center justify-center gap-2">
                              <CheckCircle className="w-4 h-4 text-emerald-600" />
                              <span>Anda Sudah Terdaftar di Kelas Ini</span>
                            </div>
                            <a
                              href={selectedClass.classLink || 'https://meet.google.com/xyz-pdq-abc'}
                              target="_blank"
                              rel="noreferrer"
                              onClick={() => {
                                addToast('success', 'Membuka Tautan Kelas', 'Menghubungkan ke ruang kelas...');
                              }}
                              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer text-center"
                            >
                              {selectedClass.classLink?.toLowerCase().includes('whatsapp.com') ? (
                                <Users className="w-4 h-4 text-white" />
                              ) : (
                                <Video className="w-4 h-4 text-white" />
                              )}
                              <span>
                                {selectedClass.classLink?.toLowerCase().includes('whatsapp.com') ? 'Gabung Grup WhatsApp' : 'Gabung Google Meet'}
                              </span>
                            </a>
                            <button
                              onClick={() => {
                                setActiveView('schedule');
                              }}
                              className="w-full bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 font-bold py-2 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <span>Lihat Jadwal Saya</span>
                            </button>
                          </div>
                        ) : selectedClass.currentQuota >= selectedClass.maxQuota ? (
                          <button
                            disabled
                            className="w-full bg-gray-200 text-gray-500 font-bold py-3.5 rounded-xl text-sm cursor-not-allowed"
                          >
                            Kuota Sudah Terpenuhi
                          </button>
                        ) : (
                          <button
                            id="btn-patungan"
                            onClick={() => setShowPaymentModal(true)}
                            className="w-full bg-orange-500 hover:bg-orange-400 text-neutral-900 font-bold py-3.5 rounded-xl shadow-md hover:shadow-orange-500/20 text-sm flex items-center justify-center gap-2 transform hover:-translate-y-0.5 transition-all cursor-pointer"
                          >
                            <span>Ikut Patungan Kelas (Rp 5.000)</span>
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        )}

                        <div className="flex items-center justify-center gap-2 text-[10px] text-gray-400">
                          <Lock className="w-3.5 h-3.5" />
                          <span>Pembayaran Aman • Proteksi Refund Kampus</span>
                        </div>

                      </div>

                    </div>

                  </div>
                </div>
              )}

              {activeView === 'mentor-verification' && (
                // ============================================================
                // MENTOR VERIFICATION SCREEN
                // ============================================================
                <div id="mentor-verification-view" className="space-y-6 flex-1 flex flex-col">
                  {/* Back Navigation Bar */}
                  <div>
                    <button 
                      onClick={() => setActiveView('mentee-dashboard')}
                      className="inline-flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-blue-600 transition-colors cursor-pointer"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Batal & Kembali ke Beranda</span>
                    </button>
                  </div>

                  <div className="max-w-3xl mx-auto w-full bg-white border border-gray-200 rounded-3xl p-6 md:p-8 shadow-xl space-y-6">
                    
                    {/* Header Info */}
                    <div className="text-center space-y-2 border-b border-gray-100 pb-6">
                      <div className="bg-orange-100 text-orange-700 p-3 rounded-2xl w-fit mx-auto mb-2 flex items-center justify-center">
                        <Award className="w-8 h-8" />
                      </div>
                      <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Ajukan Verifikasi Mentor</h2>
                      <p className="text-sm text-gray-500 max-w-xl mx-auto">
                        Bantu sesama mahasiswa memahami materi kuliah, kumpulkan dana patungan Rp 5.000 per kepala, dan raih pendapatan tambahan menarik.
                      </p>
                    </div>

                    {/* Verification Form */}
                    <form onSubmit={simulateVerificationSubmit} className="space-y-6">
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        
                        {/* Subject Selector */}
                        <div>
                          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Mata Kuliah Keahlian Utama</label>
                          <select 
                            value={selectedVerificationSubject}
                            onChange={(e) => setSelectedVerificationSubject(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-gray-800"
                          >
                            <option value="Teknik Informatika">Teknik Informatika (Algoritma, Basis Data, Web Dev)</option>
                            <option value="Sistem Informasi">Sistem Informasi (Sistem Enterprise, Manajemen Proyek)</option>
                            <option value="Kimia">Kimia (Kimia Analitik, Kimia Organik, Praktikum Lab)</option>
                            <option value="Fisika">Fisika (Fisika Kuantum, Termodinamika, Elektronika)</option>
                            <option value="Teknik Tambang">Teknik Tambang (Geologi Struktur, Teknik Peledakan)</option>
                            <option value="Agribisnis">Agribisnis (Ekonomi Pertanian, Manajemen Rantai Pasok)</option>
                            <option value="Matematika">Matematika (Aljabar Linier, Kalkulus, Statistika)</option>
                          </select>
                        </div>

                        {/* GPA input */}
                        <div>
                          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">IPK Terakhir (Skala 4.00)</label>
                          <input 
                            type="text" 
                            placeholder="Contoh: 3.85" 
                            value={gpaValue}
                            onChange={(e) => setGpaValue(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-gray-800"
                          />
                        </div>

                      </div>

                      {/* Contact Info WhatsApp */}
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">ID WhatsApp / Line untuk Koordinasi</label>
                        <input 
                          type="text" 
                          placeholder="Contoh: +62 812-3456-7890" 
                          value={contactInfo}
                          onChange={(e) => setContactInfo(e.target.value)}
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-gray-800"
                        />
                        <span className="text-[10px] text-gray-400 mt-1.5 block">Digunakan oleh admin untuk mengirimkan undangan grup koordinasi mentor Paham.in</span>
                      </div>

                      {/* Dropzone for transcript file */}
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Upload Transkrip Nilai Terakhir (KHS)</label>
                        
                        <div 
                          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                          onDragLeave={() => setIsDragging(false)}
                          onDrop={handleFileDrop}
                          className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
                            isDragging 
                              ? 'border-blue-500 bg-blue-50' 
                              : uploadedFile 
                              ? 'border-emerald-300 bg-emerald-50/20' 
                              : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                          }`}
                        >
                          <input 
                            type="file" 
                            id="transcript-file-input" 
                            onChange={handleFileSelect}
                            className="hidden" 
                            accept=".pdf,.jpg,.jpeg,.png"
                          />
                          
                          <label htmlFor="transcript-file-input" className="cursor-pointer space-y-3 block">
                            {uploadedFile ? (
                              <>
                                <div className="bg-emerald-100 text-emerald-600 p-3 rounded-full w-fit mx-auto">
                                  <FileText className="w-8 h-8" />
                                </div>
                                <div>
                                  <p className="text-sm font-bold text-gray-800">{uploadedFile.name}</p>
                                  <p className="text-xs text-gray-400 mt-1">Ukuran File: {uploadedFile.size}</p>
                                </div>
                                <div className="text-xs text-emerald-700 bg-emerald-100/60 border border-emerald-200 px-3.5 py-1.5 rounded-lg inline-block font-semibold">
                                  ✓ Berkas Berhasil Dilampirkan
                                </div>
                              </>
                            ) : (
                              <>
                                <div className="bg-blue-100 text-blue-600 p-3 rounded-full w-fit mx-auto">
                                  <Upload className="w-8 h-8" />
                                </div>
                                <div>
                                  <p className="text-sm font-bold text-gray-800">Tarik berkas KHS transkrip nilai ke sini</p>
                                  <p className="text-xs text-gray-400 mt-1">Mendukung format PDF, JPG, PNG hingga ukuran maksimal 5MB</p>
                                </div>
                                <span className="bg-white border border-gray-200 shadow-sm hover:border-gray-300 px-4 py-2 rounded-xl text-xs font-semibold inline-block text-gray-700 transition-colors">
                                  Pilih Berkas Komputer
                                </span>
                              </>
                            )}
                          </label>
                        </div>
                      </div>

                      {/* Mentor Policy Agreement checkbox */}
                      <div className="flex items-start gap-2.5 bg-gray-50 p-4 rounded-xl border border-gray-100">
                        <input type="checkbox" id="mentor-agree" className="rounded text-blue-600 focus:ring-blue-500 mt-0.5" defaultChecked />
                        <label htmlFor="mentor-agree" className="text-xs text-gray-500 select-none leading-relaxed">
                          Saya menyatakan bahwa transkrip nilai yang saya lampirkan adalah dokumen asli milik saya pribadi, dan saya bersedia mengajar secara kondusif demi menjaga kualitas belajar-mengajar di platform Paham.in.
                        </label>
                      </div>

                      {/* Submit Actions */}
                      <div className="pt-2">
                        <button 
                          type="submit"
                          id="btn-kirim-verifikasi"
                          className="w-full bg-orange-500 hover:bg-orange-400 text-neutral-900 font-bold py-3.5 rounded-xl shadow-lg hover:shadow-orange-500/20 transform hover:-translate-y-0.5 transition-all text-sm flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <Shield className="w-4 h-4" />
                          <span>Kirim Verifikasi Mentor</span>
                        </button>
                      </div>

                    </form>

                  </div>

                </div>
              )}

              {activeView === 'mentor-dashboard' && (
                // ============================================================
                // MENTOR DASHBOARD VIEW
                // ============================================================
                <div id="mentor-dashboard-view" className="space-y-6 flex-1 flex flex-col">
                  
                  {/* Top Notification / Verification Success Info */}
                  <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-6 relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-100/70 rounded-full -mr-20 -mt-20 blur-2xl"></div>
                    <div className="relative z-10 space-y-1.5">
                      <div className="bg-emerald-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" />
                        <span>MENTOR TERVERIFIKASI</span>
                      </div>
                      <h3 className="text-xl font-extrabold tracking-tight text-neutral-900">Akun Mengajar Anda Aktif!</h3>
                      <p className="text-neutral-500 text-xs sm:text-sm leading-relaxed max-w-xl">
                        Anda telah memenuhi kualifikasi IPK dan kelayakan KHS. Semua kelas yang Anda rancang akan dipublikasikan secara langsung untuk crowdfunding mahasiswa.
                      </p>
                    </div>
                    
                    <div className="relative z-10 shrink-0">
                      <button
                        onClick={() => setIsCreateClassOpen(true)}
                        className="bg-neutral-900 hover:bg-neutral-800 text-white font-bold px-5 py-2.5 rounded-xl text-xs sm:text-sm shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <Plus className="w-4 h-4 stroke-[2.5]" />
                        <span>Buat Sesi Kelas Baru</span>
                      </button>
                    </div>
                  </div>

                  {/* Earnings & Wallet Panel */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    
                    {/* Active earnings box */}
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between space-y-4">
                      <div>
                        <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-2">PENDAPATAN BULAN INI</span>
                        <h2 className="text-3xl font-black text-orange-700 leading-none">Rp {mentorEarnings.toLocaleString('id-ID')}</h2>
                        <span className="text-[10px] text-gray-400 mt-1.5 block">Diperbarui setiap ada mahasiswa masuk patungan</span>
                      </div>

                      <button
                        id="btn-tarik-dana"
                        onClick={() => setIsWithdrawOpen(true)}
                        className="w-full bg-orange-500 hover:bg-orange-400 text-neutral-900 font-bold py-2.5 rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <CreditCard className="w-4 h-4" />
                        <span>Tarik Dana Mengajar</span>
                      </button>
                    </div>

                    {/* Class Stats Summary */}
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between space-y-4">
                      <div>
                        <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-2">KELAS AKTIF DIKELOLA</span>
                        <h2 className="text-3xl font-black text-gray-800 leading-none">
                          {statistics.afifActiveCount} Kelas
                        </h2>
                        <span className="text-[10px] text-gray-400 mt-1.5 block">Sesi kelas buatan Anda yang sedang mengumpulkan patungan</span>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-emerald-600 font-semibold bg-emerald-50 p-2.5 rounded-xl border border-emerald-100">
                        <TrendingUp className="w-4 h-4" />
                        <span>Estimasi Penuh: Rp {(statistics.afifActiveCount * 50000).toLocaleString('id-ID')}</span>
                      </div>
                    </div>

                    {/* Student joined summary */}
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between space-y-4">
                      <div>
                        <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-2">ALUMNI MAHASISWA</span>
                        <h2 className="text-3xl font-black text-gray-800 leading-none">38 Mahasiswa</h2>
                        <span className="text-[10px] text-gray-400 mt-1.5 block">Total mahasiswa yang pernah belajar patungan dengan Anda</span>
                      </div>

                      <div className="flex items-center gap-1 text-[11px] text-yellow-700 font-bold bg-yellow-50 p-2.5 rounded-xl border border-yellow-100">
                        <span>★ 4.9 Rating Mengajar Keseluruhan</span>
                      </div>
                    </div>

                  </div>

                  {/* Mentor Classes List */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Daftar Kelas Buatan Saya (Kelas Aktif Saya)</h4>
                      <button 
                        onClick={() => setIsCreateClassOpen(true)}
                        className="text-xs text-blue-600 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Rancang Kelas Lain</span>
                      </button>
                    </div>

                    {mockClasses.filter(c => c.mentorName === (currentUser?.name || '')).length === 0 ? (
                      <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center max-w-xl mx-auto my-6">
                        <p className="text-sm text-gray-500">Anda belum membuat kelas mengajar pertamamu.</p>
                        <button 
                          onClick={() => setIsCreateClassOpen(true)}
                          className="mt-4 bg-blue-600 text-white font-bold px-4 py-2 rounded-xl text-xs"
                        >
                          + Rancang Kelas Perdana
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {mockClasses.filter(c => c.mentorName === (currentUser?.name || '')).map((myClass) => {
                          const quotaPercent = (myClass.currentQuota / myClass.maxQuota) * 100;
                          const currentEarnings = myClass.currentQuota * 5000;
                          
                          return (
                            <div 
                              key={myClass.id}
                              className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-4 hover:shadow-md transition-shadow"
                            >
                              <div className="flex justify-between items-start gap-4">
                                <span className="bg-blue-50 text-blue-700 text-[10px] font-extrabold tracking-wider uppercase px-2.5 py-1 rounded-full border border-blue-100">
                                  {myClass.category}
                                </span>
                                <div className="text-right">
                                  <span className="block text-[10px] text-gray-400 font-bold">TERKUMPUL SEMENTARA</span>
                                  <span className="text-sm font-black text-emerald-600">Rp {currentEarnings.toLocaleString('id-ID')}</span>
                                </div>
                              </div>

                              <div>
                                <h3 className="font-bold text-gray-900 leading-snug line-clamp-1">{myClass.title}</h3>
                                <p className="text-xs text-gray-500 line-clamp-2 mt-1 leading-relaxed">{myClass.description}</p>
                              </div>

                              <div className="flex items-center gap-3.5 text-xs text-gray-400 border-t border-b border-gray-50 py-3.5">
                                <div className="flex items-center gap-1.5">
                                  <Calendar className="w-4 h-4 text-gray-400" />
                                  <span>{myClass.dateTime}</span>
                                </div>
                              </div>

                              {/* Progress Quota of booking */}
                              <div>
                                <div className="flex justify-between items-center text-[10px] font-bold text-gray-500 mb-1.5">
                                  <span>Progress Patungan ({myClass.currentQuota}/{myClass.maxQuota} Mahasiswa)</span>
                                  <span>{quotaPercent}%</span>
                                </div>
                                <div className="w-full h-1.5 bg-neutral-200 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-orange-500 rounded-full transition-all duration-500"
                                    style={{ width: `${quotaPercent}%` }}
                                  ></div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 pt-2">
                                <button
                                  onClick={() => {
                                    // Start class link simulation
                                    addToast('info', 'Mulai Google Meet', 'Tautan Google Meet baru dibuka di tab terpisah. Pastikan mic dan kamera aktif!');
                                  }}
                                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                                >
                                  <Video className="w-4 h-4" />
                                  <span>Mulai Google Meet</span>
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedClass(myClass);
                                    setActiveView('class-detail');
                                  }}
                                  className="px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2 rounded-xl text-xs transition-colors cursor-pointer"
                                >
                                  Detail
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                </div>
              )}

              {activeView === 'schedule' && (
                // ============================================================
                // SCHEDULE VIEW
                // ============================================================
                <div id="schedule-view" className="space-y-6 flex-1 flex flex-col">
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    
                    {/* Left Panel: Mentee Schedule (joined classes) */}
                    <div className="space-y-4">
                      <div className="border-b border-gray-200 pb-3 flex items-center justify-between">
                        <h3 className="font-bold text-gray-900 flex items-center gap-2">
                          <BookOpen className="w-5 h-5 text-blue-600" />
                          <span>Kelas yang Saya Ikuti (Belajar)</span>
                        </h3>
                        <span className="bg-blue-100 text-blue-800 text-xs px-2.5 py-0.5 rounded-full font-bold">
                          {statistics.joinedCount} Sesi
                        </span>
                      </div>

                      {mockClasses.filter(c => c.isBooked).length === 0 ? (
                        <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center text-gray-500">
                          <Calendar className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                          <p className="text-sm font-medium">Anda belum bergabung di kelas patungan mana pun.</p>
                          <button 
                            onClick={() => setActiveView('mentee-dashboard')}
                            className="mt-4 bg-blue-600 text-white font-bold px-4 py-2 rounded-xl text-xs"
                          >
                            Jelajah Kelas Patungan Rp 5.000
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {mockClasses.filter(c => c.isBooked).map((joinedClass) => (
                            <div 
                              key={joinedClass.id}
                              className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-4 relative overflow-hidden"
                            >
                              <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-blue-600"></div>
                              
                              <div className="flex justify-between items-start gap-4">
                                <div className="space-y-1">
                                  <span className="text-[10px] font-extrabold text-blue-700 tracking-wider uppercase">{joinedClass.category}</span>
                                  <h4 className="font-bold text-gray-900 leading-snug">{joinedClass.title}</h4>
                                </div>
                                <span className="bg-emerald-50 text-emerald-800 border border-emerald-100 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                                  Lunas Patungan
                                </span>
                              </div>

                              <div className="grid grid-cols-2 gap-3.5 text-xs text-gray-500 bg-gray-50 p-3 rounded-xl border border-gray-100/50">
                                <div className="flex items-center gap-1.5">
                                  <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
                                  <span className="truncate">{joinedClass.dateTime}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <User className="w-4 h-4 text-gray-400 shrink-0" />
                                  <span className="truncate">Mentor: {joinedClass.mentorName}</span>
                                </div>
                              </div>

                              <div className="flex items-center gap-3">
                                <a
                                  href={joinedClass.classLink || 'https://meet.google.com/xyz-pdq-abc'}
                                  target="_blank"
                                  rel="noreferrer"
                                  onClick={() => {
                                    addToast('success', 'Membuka Tautan Kelas', 'Menghubungkan ke ruang belajar kelas patungan...');
                                  }}
                                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer text-center"
                                >
                                  {joinedClass.classLink?.toLowerCase().includes('whatsapp.com') ? (
                                    <Users className="w-4 h-4 text-white" />
                                  ) : (
                                    <Video className="w-4 h-4 text-white" />
                                  )}
                                  <span>
                                    {joinedClass.classLink?.toLowerCase().includes('whatsapp.com') ? 'Gabung Grup WhatsApp' : 'Gabung Google Meet'}
                                  </span>
                                </a>
                                
                                <button
                                  onClick={() => {
                                    setSelectedClass(joinedClass);
                                    setActiveView('class-detail');
                                  }}
                                  className="px-4 py-2 border border-gray-200 hover:bg-gray-50 rounded-xl text-xs font-semibold text-gray-700 cursor-pointer"
                                >
                                  Detail Kelas
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Right Panel: Mentor Schedule (teaching classes) */}
                    <div className="space-y-4">
                      <div className="border-b border-gray-200 pb-3 flex items-center justify-between">
                        <h3 className="font-bold text-gray-900 flex items-center gap-2">
                          <Award className="w-5 h-5 text-orange-700" />
                          <span>Kelas yang Saya Ajar (Mengajar)</span>
                        </h3>
                        <span className="bg-orange-100 text-orange-800 text-xs px-2.5 py-0.5 rounded-full font-bold">
                          {isMentor ? statistics.afifActiveCount : 0} Sesi
                        </span>
                      </div>

                      {!isMentor ? (
                        <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center text-gray-500">
                          <Shield className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                          <p className="text-sm font-medium">Anda belum mengaktifkan profil mengajar Mentor.</p>
                          <button 
                            onClick={() => setActiveView('mentor-verification')}
                            className="mt-4 bg-orange-500 text-neutral-900 font-bold px-4 py-2 rounded-xl text-xs"
                          >
                            Verifikasi Mengajar Sekarang
                          </button>
                        </div>
                      ) : statistics.afifActiveCount === 0 ? (
                        <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center text-gray-500">
                          <Plus className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                          <p className="text-sm font-medium">Anda belum merancang kelas apa pun.</p>
                          <button 
                            onClick={() => { setActiveView('mentor-dashboard'); setIsCreateClassOpen(true); }}
                            className="mt-4 bg-blue-600 text-white font-bold px-4 py-2 rounded-xl text-xs"
                          >
                            + Buat Sesi Kelas Baru
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {mockClasses.filter(c => c.mentorName === (currentUser?.name || '')).map((myClass) => (
                            <div 
                              key={myClass.id}
                              className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-4 relative overflow-hidden"
                            >
                              <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-orange-500"></div>
                              
                              <div className="flex justify-between items-start gap-4">
                                <div className="space-y-1">
                                  <span className="text-[10px] font-extrabold text-orange-700 tracking-wider uppercase">{myClass.category}</span>
                                  <h4 className="font-bold text-gray-900 leading-snug">{myClass.title}</h4>
                                </div>
                                <span className="bg-orange-50 text-orange-800 border border-orange-100 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                                  Status: {myClass.currentQuota >= 5 ? 'Siap Jalan' : 'Pengumpulan'}
                                </span>
                              </div>

                              <div className="grid grid-cols-2 gap-3.5 text-xs text-gray-500 bg-gray-50 p-3 rounded-xl border border-gray-100/50">
                                <div className="flex items-center gap-1.5">
                                  <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
                                  <span className="truncate">{myClass.dateTime}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <Users className="w-4 h-4 text-gray-400 shrink-0" />
                                  <span className="truncate">{myClass.currentQuota}/{myClass.maxQuota} Mahasiswa bergabung</span>
                                </div>
                              </div>

                              <div className="flex items-center gap-3">
                                <a
                                  href={myClass.classLink || 'https://meet.google.com/xyz-pdq-abc'}
                                  target="_blank"
                                  rel="noreferrer"
                                  onClick={() => {
                                    addToast('success', 'Membuka Tautan Mengajar', 'Membuka tautan pengajaran kelas patungan Anda...');
                                  }}
                                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer text-center"
                                >
                                  {myClass.classLink?.toLowerCase().includes('whatsapp.com') ? (
                                    <Users className="w-4 h-4 text-white" />
                                  ) : (
                                    <Video className="w-4 h-4 text-white" />
                                  )}
                                  <span>
                                    {myClass.classLink?.toLowerCase().includes('whatsapp.com') ? 'Buka Grup WhatsApp' : 'Buka Ruang Mengajar'}
                                  </span>
                                </a>
                                
                                <button
                                  onClick={() => {
                                    setSelectedClass(myClass);
                                    setActiveView('class-detail');
                                  }}
                                  className="px-4 py-2 border border-gray-200 hover:bg-gray-50 rounded-xl text-xs font-semibold text-gray-700 cursor-pointer"
                                >
                                  Detail
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                  </div>

                </div>
              )}

            </div>

            {/* Platform Footer Credits */}
            <footer className="bg-white border-t border-gray-200 py-6 px-6 text-center text-xs text-gray-400 mt-auto">
              <p>© 2026 Paham.in - Peer-to-Peer Student Micro-Mentoring & Crowdfunding. Hak Cipta Dilindungi.</p>
            </footer>

          </main>

        </div>
      )}
      </motion.div>
      </AnimatePresence>

      {/* ====================================================================
          MODAL: WITHDRAW EARNINGS
      ==================================================================== */}
      <AnimatePresence>
        {isWithdrawOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsWithdrawOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            
            {/* Content Card */}
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 relative z-10 space-y-5"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Tarik Saldo Pendapatan</h3>
                  <p className="text-xs text-gray-500 mt-1">Sesi dana patungan dari para mahasiswa siap ditransfer ke rekening dompet digital Anda.</p>
                </div>
                <button 
                  onClick={() => setIsWithdrawOpen(false)}
                  className="p-1 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleWithdrawFunds} className="space-y-4">
                
                {/* Balance display info */}
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100/50 flex items-center justify-between">
                  <div>
                    <span className="block text-[10px] font-bold text-blue-700 uppercase tracking-widest">Saldo Tersedia</span>
                    <span className="text-xl font-extrabold text-blue-900">Rp {mentorEarnings.toLocaleString('id-ID')}</span>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setWithdrawAmount(mentorEarnings.toString())}
                    className="text-xs text-blue-700 hover:underline font-bold"
                  >
                    Tarik Semua
                  </button>
                </div>

                {/* Input withdraw amount */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">Jumlah Penarikan (Rp)</label>
                  <input 
                    type="number" 
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    max={mentorEarnings}
                    placeholder="Masukkan nominal, contoh: 100000"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-gray-800"
                  />
                </div>

                {/* Payment channel selector */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">Pilih Rekening / Dompet Digital</label>
                  <div className="grid grid-cols-2 gap-2.5">
                    {['GoPay', 'OVO', 'Dana', 'Bank BCA'].map((channel) => (
                      <button
                        type="button"
                        key={channel}
                        onClick={() => setWithdrawChannel(channel)}
                        className={`p-3 rounded-xl border text-xs font-bold text-center transition-all ${
                          withdrawChannel === channel
                            ? 'border-orange-500 bg-orange-50 text-orange-700'
                            : 'border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        {channel}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-2">
                  <button 
                    type="submit"
                    className="w-full bg-orange-500 hover:bg-orange-400 text-neutral-900 font-bold py-3.5 rounded-xl shadow-lg hover:shadow-orange-500/20 text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>Konfirmasi Penarikan</span>
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ====================================================================
          MODAL: CREATE NEW CLASS
      ==================================================================== */}
      <AnimatePresence>
        {isCreateClassOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCreateClassOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            
            {/* Content Card */}
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 relative z-10 space-y-5"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Rancang Sesi Kelas Baru</h3>
                  <p className="text-xs text-gray-500 mt-1">Buat sesi materi kuliah spesifik yang diminati mahasiswa demi mendongkrak crowdfunding patungan.</p>
                </div>
                <button 
                  onClick={() => setIsCreateClassOpen(false)}
                  className="p-1 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateClass} className="space-y-4">
                
                {/* Title */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">Judul Sesi Pembelajaran / Materi Spesifik</label>
                  <input 
                    type="text" 
                    placeholder="Contoh: Bongkar Soal UAS Struktur Data / Tips Praktikum Java" 
                    value={newClassTitle}
                    onChange={(e) => setNewClassTitle(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-gray-800"
                    required
                  />
                </div>

                {/* Grid Category & duration */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Category */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">Kategori / Jurusan</label>
                    <select 
                      value={newClassCategory}
                      onChange={(e) => setNewClassCategory(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-gray-800"
                    >
                      <option value="Teknik Informatika">Teknik Informatika</option>
                      <option value="Sistem Informasi">Sistem Informasi</option>
                      <option value="Kimia">Kimia</option>
                      <option value="Fisika">Fisika</option>
                      <option value="Teknik Tambang">Teknik Tambang</option>
                      <option value="Agribisnis">Agribisnis</option>
                      <option value="Matematika">Matematika</option>
                    </select>
                  </div>

                  {/* Duration */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">Durasi Pembelajaran</label>
                    <select 
                      value={newClassDuration}
                      onChange={(e) => setNewClassDuration(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-gray-800"
                    >
                      <option value="90 Menit">90 Menit Sesi</option>
                      <option value="120 Menit">120 Menit Sesi</option>
                      <option value="150 Menit">150 Menit Sesi</option>
                    </select>
                  </div>
                </div>

                {/* Date and Time Description */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">Jadwal Sesi Kuliah</label>
                    <input 
                      type="text" 
                      placeholder="Sabtu, 11 Juli 2026 pukul 19:00 WIB" 
                      value={newClassDateTime}
                      onChange={(e) => setNewClassDateTime(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-gray-800"
                      required
                    />
                  </div>

                  <div className="bg-orange-50 border border-orange-100 p-3 rounded-xl flex flex-col justify-center">
                    <span className="block text-[9px] font-bold text-orange-700 uppercase tracking-widest">PRINSIP PATUNGAN FLAT</span>
                    <p className="text-[10px] text-orange-800 mt-1 leading-snug">Sesuai aturan Paham.in, biaya flat patungan adalah <span className="font-bold">Rp 5.000 / mhs</span> dengan batas kuota maksimal <span className="font-bold">10 mahasiswa</span>.</p>
                  </div>
                </div>

                {/* Link Sesi (Google Meet / WhatsApp Group) */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">Tautan Kelas / Koordinasi (Google Meet / Grup WA)</label>
                  <input 
                    type="url" 
                    placeholder="Contoh: https://meet.google.com/abc-defg-hij atau https://chat.whatsapp.com/..." 
                    value={newClassLink}
                    onChange={(e) => setNewClassLink(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-gray-800"
                    required
                  />
                  <p className="text-[10px] text-gray-400 mt-1">Sediakan link Google Meet untuk video call pembelajaran atau link Grup WhatsApp untuk tempat koordinasi patungan mahasiswa.</p>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">Deskripsi Lengkap / Apa yang Dipelajari</label>
                  <textarea 
                    rows={3}
                    placeholder="Tuliskan silabus singkat, contoh: 'Di sesi ini kita akan membongkar 3 tipe logika array multi-dimensi, tips optimalisasi runtime Java, dan kuis uji coba untuk UTS.'" 
                    value={newClassDescription}
                    onChange={(e) => setNewClassDescription(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-gray-800 resize-none"
                    required
                  />
                </div>

                <div className="pt-2 flex gap-3">
                  <button 
                    type="button"
                    onClick={() => setIsCreateClassOpen(false)}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl text-xs shadow-md transition-colors cursor-pointer"
                  >
                    Publikasikan Kelas Patungan
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ====================================================================
          MODAL: PAYMENT (QRIS)
      ==================================================================== */}
      <AnimatePresence>
        {showPaymentModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPaymentModal(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            
            {/* Content Card */}
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 relative z-10 space-y-5 text-center"
            >
              <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                <h3 className="text-lg font-bold text-gray-900 text-left">Selesaikan Pembayaran</h3>
                <button 
                  onClick={() => setShowPaymentModal(false)}
                  className="p-1 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex flex-col items-center py-4 space-y-4">
                {/* QR Code image */}
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 shadow-inner flex items-center justify-center">
                  <img 
                    src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=DummyQRIS" 
                    alt="QRIS Code" 
                    className="w-48 h-48 rounded-lg object-contain"
                  />
                </div>
                
                <div className="space-y-1.5">
                  <p className="text-sm font-semibold text-gray-700">
                    Scan QRIS ini untuk membayar <span className="text-orange-700 font-extrabold text-lg">Rp 5.000</span>
                  </p>
                  <p className="text-xs text-gray-400 max-w-xs mx-auto">
                    Bisa scan menggunakan GoPay, OVO, Dana, LinkAja, BCA Mobile, atau aplikasi M-Banking lainnya.
                  </p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="pt-2 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button 
                  type="button"
                  onClick={handleConfirmPayment}
                  className="flex-1 bg-orange-500 hover:bg-orange-400 text-neutral-900 font-bold py-3 rounded-xl text-xs shadow-md transition-all cursor-pointer hover:shadow-orange-500/20"
                >
                  Konfirmasi Pembayaran
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
