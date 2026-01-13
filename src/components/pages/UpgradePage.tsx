import { motion } from "framer-motion";
import { Crown, Check, Zap, Music2, Download, Mic2, Sparkles } from "lucide-react";

const UpgradePage = () => {
  const plans = [
    {
      name: "Free",
      price: "$0",
      period: "/month",
      features: [
        "Stream unlimited music",
        "Create up to 10 playlists",
        "Basic audio quality",
        "Ads included",
      ],
      current: true,
    },
    {
      name: "Pro",
      price: "$9.99",
      period: "/month",
      features: [
        "Everything in Free",
        "Unlimited playlists",
        "High quality audio (320kbps)",
        "No ads",
        "Offline downloads",
        "Priority support",
      ],
      popular: true,
    },
    {
      name: "Artist",
      price: "$19.99",
      period: "/month",
      features: [
        "Everything in Pro",
        "Upload unlimited tracks",
        "Detailed analytics",
        "Verified artist badge",
        "Priority playlist placement",
        "Direct fan messaging",
        "Revenue share: 80%",
      ],
    },
  ];

  const benefits = [
    { icon: Music2, title: "Unlimited Uploads", description: "Upload and share as many tracks as you want" },
    { icon: Zap, title: "High Quality", description: "Stream and download in 320kbps or lossless" },
    { icon: Download, title: "Offline Mode", description: "Download music to listen anywhere" },
    { icon: Mic2, title: "Artist Tools", description: "Get detailed analytics and fan insights" },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="flex-1 overflow-y-auto pb-32">
      {/* Header */}
      <div className="gradient-hero pt-6 md:pt-8 pb-8 md:pb-12 px-4 md:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center mx-auto mb-4">
            <Crown className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl md:text-5xl font-display font-bold text-foreground mb-2">
            Upgrade to Pro
          </h1>
          <p className="text-muted-foreground text-base md:text-lg max-w-xl mx-auto">
            Unlock the full Auralis experience with premium features
          </p>
        </motion.div>
      </div>

      {/* Plans */}
      <section className="px-4 md:px-8 py-6">
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {plans.map((plan, index) => (
            <motion.div
              key={index}
              className={`glass rounded-2xl p-6 md:p-8 border transition-all ${
                plan.popular 
                  ? 'border-primary/50 ring-2 ring-primary/20' 
                  : 'border-border/30 hover:border-primary/30'
              }`}
              variants={itemVariants}
              whileHover={{ y: -4 }}
            >
              {plan.popular && (
                <div className="flex items-center gap-2 text-primary text-sm font-medium mb-4">
                  <Sparkles className="w-4 h-4" />
                  Most Popular
                </div>
              )}
              <h3 className="text-xl md:text-2xl font-display font-bold text-foreground mb-2">
                {plan.name}
              </h3>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-3xl md:text-4xl font-display font-bold text-foreground">
                  {plan.price}
                </span>
                <span className="text-muted-foreground">{plan.period}</span>
              </div>
              <ul className="space-y-3 mb-6">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    {feature}
                  </li>
                ))}
              </ul>
              <motion.button
                className={`w-full py-3 rounded-xl font-medium transition-colors ${
                  plan.current
                    ? 'bg-surface-elevated text-muted-foreground cursor-default'
                    : plan.popular
                    ? 'gradient-primary text-primary-foreground glow-primary'
                    : 'glass border-glow text-foreground hover:bg-primary hover:text-primary-foreground'
                }`}
                whileHover={!plan.current ? { scale: 1.02 } : {}}
                whileTap={!plan.current ? { scale: 0.98 } : {}}
                disabled={plan.current}
              >
                {plan.current ? 'Current Plan' : 'Upgrade Now'}
              </motion.button>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Benefits */}
      <section className="px-4 md:px-8 py-6">
        <h2 className="text-xl md:text-2xl font-display font-bold text-foreground mb-6 text-center">
          Why Go Pro?
        </h2>
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {benefits.map((benefit, index) => (
            <motion.div
              key={index}
              className="glass rounded-xl p-6 border border-border/30 text-center"
              variants={itemVariants}
            >
              <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center mx-auto mb-4">
                <benefit.icon className="w-6 h-6 text-primary-foreground" />
              </div>
              <h3 className="font-display font-bold text-foreground mb-2">
                {benefit.title}
              </h3>
              <p className="text-sm text-muted-foreground">
                {benefit.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </section>
    </div>
  );
};

export default UpgradePage;
