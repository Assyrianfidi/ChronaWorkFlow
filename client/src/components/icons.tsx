import * as React from 'react';
import { IconType } from 'react-icons';
import { FiAlertCircle, FiAlertTriangle, FiCheckCircle, FiChevronDown, FiChevronRight, FiChevronUp, FiCircle, FiClock, FiCopy, FiCreditCard, FiDollarSign, FiDownload, FiEdit, FiEye, FiEyeOff, FiFileText, FiFilter, FiHelpCircle, FiHome, FiInfo, FiLayers, FiList, FiLoader, FiLock, FiLogOut, FiMail, FiMenu, FiMessageSquare, FiMinus, FiMoon, FiMoreHorizontal, FiPackage, FiPlus, FiRefreshCw, FiSave, FiSearch, FiSettings, FiShare2, FiShield, FiStar, FiSun, FiTrash2, FiTrendingDown, FiTrendingUp, FiUpload, FiUser, FiUserPlus, FiUsers, FiX, FiXCircle, FiZap } from 'react-icons/fi';
import { FaGoogle, FaGithub } from 'react-icons/fa';

type IconProps = React.HTMLAttributes<SVGElement> & {
  className?: string;
};

export const Icons = {
  // Basic UI
  spinner: (props: IconProps) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  ),
  logo: (props: IconProps) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
    </svg>
  ),
  
  // Social Icons
  google: FaGoogle,
  github: FaGithub,
  
  // Feather Icons
  alertCircle: FiAlertCircle,
  alertTriangle: FiAlertTriangle,
  checkCircle: FiCheckCircle,
  chevronDown: FiChevronDown,
  chevronRight: FiChevronRight,
  chevronUp: FiChevronUp,
  circle: FiCircle,
  clock: FiClock,
  copy: FiCopy,
  creditCard: FiCreditCard,
  dollarSign: FiDollarSign,
  download: FiDownload,
  edit: FiEdit,
  eye: FiEye,
  eyeOff: FiEyeOff,
  fileText: FiFileText,
  filter: FiFilter,
  helpCircle: FiHelpCircle,
  home: FiHome,
  info: FiInfo,
  layers: FiLayers,
  list: FiList,
  loader: FiLoader,
  lock: FiLock,
  logOut: FiLogOut,
  mail: FiMail,
  menu: FiMenu,
  messageSquare: FiMessageSquare,
  minus: FiMinus,
  moon: FiMoon,
  moreHorizontal: FiMoreHorizontal,
  package: FiPackage,
  plus: FiPlus,
  refreshCw: FiRefreshCw,
  save: FiSave,
  search: FiSearch,
  settings: FiSettings,
  share2: FiShare2,
  shield: FiShield,
  star: FiStar,
  sun: FiSun,
  trash2: FiTrash2,
  trendingDown: FiTrendingDown,
  trendingUp: FiTrendingUp,
  upload: FiUpload,
  user: FiUser,
  userPlus: FiUserPlus,
  users: FiUsers,
  x: FiX,
  xCircle: FiXCircle,
  zap: FiZap,
  
  // Add more custom icons as needed
} as const;

export type IconName = keyof typeof Icons;
