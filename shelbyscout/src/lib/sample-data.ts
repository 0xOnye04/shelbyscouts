export const samplePlayers = [
  {
    id: "player-1",
    name: "Kofi Mensah",
    position: "Forward",
    age: 19,
    rating: 91,
    speed: 94,
    agility: 90,
    goals: 31,
    assists: 9,
    popularity: 96,
    profileImage:
      "https://images.unsplash.com/photo-1521412644187-c49fa049e84d?auto=format&fit=crop&w=500&q=60",
    coverImage:
      "https://images.unsplash.com/photo-1508606572321-901ea4437072?auto=format&fit=crop&w=1200&q=80",
    bio: "Accra-born striker with explosive first steps, sharp finishing, and viral short clips from academy matches.",
  },
  {
    id: "player-2",
    name: "Amina Bello",
    position: "Midfielder",
    age: 21,
    rating: 87,
    speed: 86,
    agility: 89,
    goals: 10,
    assists: 22,
    popularity: 90,
    profileImage:
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=500&q=60",
    coverImage:
      "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?auto=format&fit=crop&w=1200&q=80",
    bio: "Lagos playmaker known for press resistance, creative passing, and training clips that scouts can replay instantly.",
  },
  {
    id: "player-3",
    name: "Thabo Mokoena",
    position: "Defender",
    age: 20,
    rating: 84,
    speed: 88,
    agility: 85,
    goals: 5,
    assists: 14,
    popularity: 82,
    profileImage:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=500&q=60",
    coverImage:
      "https://images.unsplash.com/photo-1500674425229-f692875b0ab7?auto=format&fit=crop&w=1200&q=80",
    bio: "Johannesburg wingback with recovery pace, aggressive overlaps, and strong one-on-one defending.",
  },
  {
    id: "player-4",
    name: "Mariam Diop",
    position: "Goalkeeper",
    age: 18,
    rating: 83,
    speed: 76,
    agility: 88,
    goals: 0,
    assists: 3,
    popularity: 85,
    profileImage:
      "https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&w=500&q=60",
    coverImage:
      "https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=1200&q=80",
    bio: "Dakar goalkeeper with quick reflexes, confident distribution, and clean-sheet clips built for scout review.",
  },
];

export const sampleVideos = [
  {
    id: "video-1",
    title: "Kofi Mensah 60-second goal burst",
    description: "Short-form striker reel with acceleration, near-post finishing, and Shelby-backed global streaming.",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=800&q=80",
    url: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
    storageProvider: "demo",
    storageAssetId: "sample-kofi-goal-burst",
    storageProof: "Sample clip. Configure Shelby credentials to create real storage proof.",
    isShelbyStored: false,
    playerId: "player-1",
    playerName: "Kofi Mensah",
  },
  {
    id: "video-2",
    title: "Amina Bello press-break drill",
    description: "Midfield control, first touch, and passing range packaged like a football Reel for scouts.",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1521412644187-c49fa049e84d?auto=format&fit=crop&w=800&q=80",
    url: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4",
    storageProvider: "demo",
    storageAssetId: "sample-amina-press-break",
    storageProof: "Sample clip. Configure Shelby credentials to create real storage proof.",
    isShelbyStored: false,
    playerId: "player-2",
    playerName: "Amina Bello",
  },
  {
    id: "video-3",
    title: "Thabo Mokoena recovery tackles",
    description: "Fast defensive transitions, overlapping runs, and match clips stored through the Shelby media layer.",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1508606572321-901ea4437072?auto=format&fit=crop&w=800&q=80",
    url: "https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    storageProvider: "demo",
    storageAssetId: "sample-thabo-recovery-tackles",
    storageProof: "Sample clip. Configure Shelby credentials to create real storage proof.",
    isShelbyStored: false,
    playerId: "player-3",
    playerName: "Thabo Mokoena",
  },
  {
    id: "video-4",
    title: "Mariam Diop reaction saves",
    description: "Goalkeeper reflex clips, distribution highlights, and club-ready performance data.",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=800&q=80",
    url: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    storageProvider: "demo",
    storageAssetId: "sample-mariam-reaction-saves",
    storageProof: "Sample clip. Configure Shelby credentials to create real storage proof.",
    isShelbyStored: false,
    playerId: "player-4",
    playerName: "Mariam Diop",
  },
];

export function getSamplePlayer(id: string) {
  return samplePlayers.find((player) => player.id === id);
}

export function getSampleVideosForPlayer(playerId: string) {
  return sampleVideos.filter((video) => video.playerId === playerId);
}
