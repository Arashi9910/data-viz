import React from 'react';
import Link from 'next/link';

const Header = ({ title }) => {
  return (
    <header className="bg-gradient-to-r from-blue-600 to-blue-800 shadow-md">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-white text-2xl font-bold">{title || '數據可視化儀表板'}</h1>
          </div>
          <nav>
            <ul className="flex space-x-4">
              <li>
                <Link href="/sheet-data">
                  <a className="text-white hover:text-blue-200 transition-colors px-3 py-2 rounded hover:bg-blue-700">
                    品牌數據
                  </a>
                </Link>
              </li>
              <li>
                <Link href="/view-data">
                  <a className="text-white hover:text-blue-200 transition-colors px-3 py-2 rounded hover:bg-blue-700">
                    賣場數據
                  </a>
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header; 