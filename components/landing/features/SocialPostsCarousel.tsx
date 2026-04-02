import Image from 'next/image';

const SocialPostsCarousel = () => {
  const posts = [
    {
      platform: 'Instagram',
      color: 'text-pink-500',
      brandName: 'Lagos Bites',
      handle: '@lagosbites',
      avatar: 'LB',
      avatarBg: 'bg-gradient-to-br from-pink-500 to-orange-400',
      caption:
        "New Jollof Rice bowl just dropped! Our weekend special is here and trust us — you don't want to miss this one. Order now on our app!",
      hashtags: '#LagosBites #JollofRice #NaijaFood #WeekendVibes',
      likes: '2,847',
      comments: '183',
      image: '/images/post-jollof.jpg',
    },
    {
      platform: 'X.com',
      color: 'text-foreground',
      brandName: 'FreshFit Gym',
      handle: '@freshfit_ng',
      avatar: 'FF',
      avatarBg: 'bg-uri-green',
      caption:
        "Your Monday motivation just arrived. Consistency beats intensity. Show up today, even if it's just for 20 minutes.",
      hashtags: '#FitnessNigeria #MondayMotivation #GymLife',
      likes: '1,204',
      comments: '89',
      image: '/images/post-fitness.jpg',
    },
    {
      platform: 'Facebook',
      color: 'text-blue-600',
      brandName: 'Aura Beauty Studio',
      handle: 'Aura Beauty Studio',
      avatar: 'AB',
      avatarBg: 'bg-uri-purple',
      caption:
        'Glow up season is HERE! Book your bridal makeup trial this week and get 15% off your wedding day package.',
      hashtags: '#AuraBeauty #BridalMakeup #LagosWedding',
      likes: '956',
      comments: '124',
      image: '/images/post-beauty.jpg',
    },
    {
      platform: 'LinkedIn',
      color: 'text-blue-700',
      brandName: 'Pulse Agency',
      handle: 'Pulse Creative Agency',
      avatar: 'PA',
      avatarBg: 'bg-uri-blue',
      caption:
        "We helped a client go from 200 to 12,000 followers in 90 days — without a single paid ad. Here's what we learned:",
      hashtags: '#SocialMediaMarketing #AgencyLife',
      likes: '3,412',
      comments: '267',
      image: '/images/post-analytics.jpg',
    },
  ];

  const posts2 = [
    {
      platform: 'TikTok',
      color: 'text-foreground',
      brandName: 'Chef Nkem',
      handle: '@chefnkem',
      avatar: 'CN',
      avatarBg: 'bg-gradient-to-br from-pink-500 to-cyan-400',
      caption: 'POV: You tried making Egusi soup for the first time and your Nigerian friend is JUDGING.',
      hashtags: '#NigerianFood #EgusiSoup #CookingTikTok',
      likes: '48.2K',
      comments: '2,891',
      image: '/images/post-egusi.jpg',
    },
    {
      platform: 'Pinterest',
      color: 'text-red-600',
      brandName: 'Accra Interiors',
      handle: '@accrainteriors',
      avatar: 'AI',
      avatarBg: 'bg-red-500',
      caption: 'Minimalist Afro-modern living room inspo. Earthy tones, local textiles, clean lines.',
      hashtags: '#InteriorDesign #AfricanDecor #HomeInspo',
      likes: '5,621',
      comments: '312',
      image: '/images/post-interior.jpg',
    },
    {
      platform: 'Instagram',
      color: 'text-pink-500',
      brandName: 'Sweet Tooth Lagos',
      handle: '@sweettooth_lag',
      avatar: 'ST',
      avatarBg: 'bg-gradient-to-br from-pink-300 to-purple-400',
      caption: 'Ice cream weather is every weather in Lagos! Come grab our new Cookies & Cream cone.',
      hashtags: '#SweetToothLagos #IceCream #LagosEats',
      likes: '3,567',
      comments: '289',
      image: '/images/post-icecream.jpg',
    },
  ];

  const PostCard = ({ post }: { post: (typeof posts)[0] }) => (
    <div className="w-[360px] flex-shrink-0 comic-panel" style={{ backgroundColor: 'white' }}>
      <div className="flex items-center gap-3 p-5 pb-3">
        <div
          className={`w-12 h-12 rounded-full ${post.avatarBg} flex items-center justify-center text-white font-black text-sm`}
          style={{ borderWidth: '2px', borderStyle: 'solid', borderColor: 'black' }}
        >
          {post.avatar}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-black leading-tight truncate" style={{ color: 'black' }}>
            {post.brandName}
          </p>
          <p className="text-xs font-semibold truncate" style={{ color: 'rgba(0, 0, 0, 0.5)' }}>
            {post.handle}
          </p>
        </div>
      </div>
      <div
        className="mx-5 mb-3 h-48 rounded-lg overflow-hidden"
        style={{ borderWidth: '2px', borderStyle: 'solid', borderColor: 'black' }}
      >
        <Image src={post.image} alt={post.brandName} width={360} height={192} className="w-full h-full object-cover" />
      </div>
      <div className="px-5 pb-5">
        <p
          className="text-sm font-semibold leading-relaxed mb-3"
          style={{
            color: 'black',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {post.caption}
        </p>
        <p
          className="text-xs font-bold mb-4"
          style={{
            color: 'hsl(207, 90%, 54%)',
            display: '-webkit-box',
            WebkitLineClamp: 1,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {post.hashtags}
        </p>
        <div
          className="flex items-center gap-6 text-sm font-bold pt-3"
          style={{ borderTop: '2px solid rgba(0, 0, 0, 0.08)', color: 'rgba(0, 0, 0, 0.6)' }}
        >
          <span>{post.likes} likes</span>
          <span>{post.comments} comments</span>
        </div>
      </div>
    </div>
  );

  return (
    <section className="py-16 lg:py-20 overflow-hidden" style={{ backgroundColor: 'hsl(12, 100%, 98%)' }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <div className="text-center">
          <div className="comic-caption inline-block mb-4">LIVE EXAMPLES</div>
          <h2
            className="comic-headline text-3xl sm:text-4xl lg:text-5xl font-black mb-3"
            style={{ color: 'black', transform: 'rotate(-1deg)' }}
          >
            Posts <span className="highlight-strip">Jane creates.</span> Every day.
          </h2>
          <p className="font-semibold max-w-xl mx-auto" style={{ color: 'rgba(0, 0, 0, 0.6)' }}>
            Real content for real brands — across every platform that matters.
          </p>
        </div>
      </div>

      {/* First row - scrolls left */}
      <div className="relative mb-6">
        <div className="flex gap-6 animate-marquee-slow pl-6" style={{ width: 'max-content' }}>
          {[...posts, ...posts, ...posts].map((post, i) => (
            <PostCard key={`row1-${i}`} post={post} />
          ))}
        </div>
      </div>

      {/* Second row - scrolls right (reverse) */}
      <div className="relative">
        <div className="flex gap-6 animate-marquee-reverse pl-6" style={{ width: 'max-content' }}>
          {[...posts2, ...posts2, ...posts2].map((post, i) => (
            <PostCard key={`row2-${i}`} post={post} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default SocialPostsCarousel;
