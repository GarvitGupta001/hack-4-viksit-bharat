'use client';

import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Link from 'next/link';
import { motion } from 'framer-motion';

const HomePage = () => {
  return (
    <div className="page-container">
      <Navbar />

      <main className="main-content">

        {/* HERO */}
        <section className="section-y-lg pt-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center max-w-5xl mx-auto"
          >
            <h1 className="text-display font-bold leading-tight mb-6" style={{color: "goldenrod"}}>
              Turn Your Green Assets Into{' '}
              <span className="bg-gradient-to-r from-sky-500 to-green-500 bg-clip-text text-transparent">
                Verified Carbon Credits
              </span>
            </h1>

            <p className="text-subtitle text-lg max-w-2xl mx-auto mb-10 text-slate-600">
              Plant trees, verify land, earn tradable carbon credits through AI-powered verification.
              Democratizing the carbon market for individuals and communities.
            </p>

            <div className="flex flex-wrap justify-center gap-4 mb-12">
              <Link
                href="/signup"
                className="nav-button signup-btn px-8 py-4 text-lg font-semibold"
              >
                Get Started Free
              </Link>

              <Link
                href="/#about"
                className="nav-button logout-btn px-8 py-4 text-lg"
              >
                Learn More
              </Link>
            </div>

            <div className="max-w-6xl mx-auto rounded-3xl overflow-hidden shadow-2xl border border-slate-200">
              <img
                src="/banner.png"
                alt="CarbonCoin Marketplace Platform"
                className="w-full h-auto block"
              />
            </div>
          </motion.div>
        </section>

        {/* HOW IT WORKS */}
        <section className="section-y-lg">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="max-w-6xl mx-auto"
          >
            <h2 className="text-title text-center mb-3" style={{color: "steelblue"}}>
              How It Works
            </h2>

            <p className="text-muted text-center text-lg max-w-2xl mx-auto mb-12">
              Three simple steps to turn your environmental impact into verified carbon credits
            </p>

            <div className="grid gap-8 md:grid-cols-3">

              {/* CARD 1 */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 }}
                className="surface-elevated p-8 text-center"
              >
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-sky-500 to-green-500 flex items-center justify-center mx-auto mb-6 text-2xl">
                  📝
                </div>

                <h3 className="text-title text-xl mb-3" style={{color: "steelblue"}}>
                  Register Your Assets
                </h3>

                <p className="text-body text-slate-600">
                  Submit your green assets—trees, land, or plantations—with supporting documentation for verification.
                </p>
              </motion.div>

              {/* CARD 2 */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.4 }}
                className="surface-elevated p-8 text-center"
              >
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-sky-500 to-green-500 flex items-center justify-center mx-auto mb-6 text-2xl">
                  🛰️
                </div>

                <h3 className="text-title text-xl mb-3" style={{color: "steelblue"}}>
                  AI Verification
                </h3>

                <p className="text-body text-slate-600">
                  Our AI-powered system uses satellite imagery and geospatial monitoring to verify your assets accurately.
                </p>
              </motion.div>

              {/* CARD 3 */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.5 }}
                className="surface-elevated p-8 text-center"
              >
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-sky-500 to-green-500 flex items-center justify-center mx-auto mb-6 text-2xl">
                  🪙
                </div>

                <h3 className="text-title text-xl mb-3" style={{color: "steelblue"}}>
                  Earn Carbon Coins
                </h3>

                <p className="text-body text-slate-600">
                  Receive tradable carbon credits based on your verified carbon offset potential. Trade and monetize your impact.
                </p>
              </motion.div>

            </div>
          </motion.div>
        </section>

        {/* ABOUT */}
        <section id="about" className="section-y-lg">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="max-w-4xl mx-auto text-center"
          >
            <h2 className="text-title mb-6" style={{ color: "ForestGreen" }}>
  🌱 About CarbonCoin
</h2>

<div className="text-left text-lg text-slate-600 space-y-6 leading-relaxed">

  <p>
    CarbonCoin is a next-generation{" "}
    <strong className="text-slate-900">
      Carbon Capitalization Marketplace
    </strong>{" "}
    designed to transform everyday environmental efforts into{" "}
    <strong className="text-slate-900">
      verified, measurable, and tradable value
    </strong>.
    We empower individuals, landowners, and organizations to participate directly in the global carbon economy without relying on complex intermediaries.
  </p>

  <p>
    By leveraging{" "}
    <strong className="text-slate-900">AI-powered verification</strong>,
    high-resolution satellite imagery, and advanced geospatial monitoring,
    CarbonCoin ensures that every registered green asset is validated with
    accuracy and transparency. This reduces fraud, increases accountability,
    and builds long-term trust across the ecosystem.
  </p>

  <h3 className="text-xl font-semibold text-slate-900">
    ✅ Register → 🛰️ Verify → 🪙 Earn
  </h3>

  <p>
    Users begin by registering their green assets, whether trees,
    agricultural land, or conservation areas. Our intelligent verification
    system analyzes environmental impact, confirms authenticity, and calculates
    carbon offset potential.
  </p>

  <p>
    Once verified, contributors receive{" "}
    <strong className="text-slate-900">Carbon Coins</strong>, digital carbon
    credits issued based on scientifically validated sequestration capacity.
    These credits can be held, transferred, or traded within a transparent and
    secure marketplace.
  </p>

  <p>
    CarbonCoin bridges the gap between climate contributors and companies
    seeking credible sustainability solutions. By creating a trusted,
    technology-driven marketplace, we make climate action{" "}
    <strong className="text-slate-900">
      transparent, inclusive, and economically rewarding
    </strong>{" "}
    for all participants.
  </p>

</div>

          </motion.div>
        </section>

      </main>

      <Footer />
    </div>
  );
};

export default HomePage;
