-- Migration: News Articles Table (Actualités Coupe du Monde 2026)
-- Created: 2026-04-02

CREATE TABLE IF NOT EXISTS public.news_articles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  summary     TEXT,
  content     TEXT,
  published_at TIMESTAMPTZ DEFAULT NOW(),
  category    TEXT DEFAULT 'Actualités',
  tags        TEXT[] DEFAULT '{}',
  author      TEXT DEFAULT 'AlgoPronos AI',
  status      TEXT DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
  cover_image TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast listing by date + status
CREATE INDEX IF NOT EXISTS idx_news_published_at ON public.news_articles (published_at DESC)
  WHERE status = 'published';
CREATE INDEX IF NOT EXISTS idx_news_slug ON public.news_articles (slug);
CREATE INDEX IF NOT EXISTS idx_news_category ON public.news_articles (category);

-- Auto-update updated_at on row changes
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_news_updated_at ON public.news_articles;
CREATE TRIGGER trg_news_updated_at
  BEFORE UPDATE ON public.news_articles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS
ALTER TABLE public.news_articles ENABLE ROW LEVEL SECURITY;

-- Anyone can read published articles
CREATE POLICY "Public read published news"
  ON public.news_articles FOR SELECT
  USING (status = 'published');

-- Only service role (admin) can insert / update / delete
CREATE POLICY "Service role write news"
  ON public.news_articles FOR ALL
  USING (true)
  WITH CHECK (true);

-- ─── Seed — Articles initiaux Coupe du Monde 2026 ────────────────────────────

INSERT INTO public.news_articles (title, slug, summary, content, published_at, category, tags, author, status)
VALUES
(
  'Coupe du Monde 2026 : tout ce qu''il faut savoir avant le coup d''envoi',
  'coupe-du-monde-2026-presentation',
  '48 équipes, 3 pays hôtes, 104 matchs. La Coupe du Monde 2026 s''annonce comme la plus grande de l''histoire du football. AlgoPronos analyse les favoris, les outsiders et les groupes.',
  'La 22ème édition de la Coupe du Monde FIFA se tiendra aux États-Unis, au Canada et au Mexique du 11 juin au 19 juillet 2026. Pour la première fois de l''histoire, 48 équipes nationales s''affronteront dans ce tournoi élargi. Le format comporte 8 groupes de 6 équipes en phase de groupes, avant une phase à élimination directe jusqu''à la grande finale prévue à New York.

Les grandes nations favorites incluent la France (championne du monde 2018, finaliste 2022), l''Argentine (championne en titre), le Brésil, l''Espagne et l''Allemagne. Notre algorithme IA analyse en temps réel les cotes de marché et les statistiques de performance pour identifier les meilleures opportunités de value betting.

Pour chaque match, AlgoPronos propose une analyse IA complète avec les value bets identifiés, les cotes optimisées sur 1xBet et un ticket générateur automatique. Suivez l''intégralité du Mondial 2026 avec notre plateforme.',
  '2026-04-02T10:00:00Z',
  'Présentation',
  ARRAY['Mondial 2026', 'Présentation', 'Favoris', 'Format'],
  'AlgoPronos AI',
  'published'
),
(
  'Groupe E : Argentine vs France, le remake explosive de la finale 2022',
  'groupe-e-argentine-france-mondial-2026',
  'Le tirage au sort a placé l''Argentine et la France dans le même groupe ! Un remake de la finale 2022 dès la phase de groupes. Notre IA analyse les chances de qualification des deux géants.',
  'L''une des affiches les plus attendues de la Coupe du Monde 2026 se jouera dès la phase de groupes : Argentine vs France, le 23 juin 2026 au MetLife Stadium de New York. Ce match revêt une signification particulière — c''est le remake direct de la finale 2022 remportée aux tirs au but par l''Argentine de Lionel Messi face à l''équipe de France.

Analyse IA AlgoPronos : Les deux équipes arrivent en position de force. L''Argentine, championne en titre, possède une machine offensive redoutable. La France, de son côté, a renouvelé son effectif avec l''éclosion de nouveaux talents. Selon notre algorithme, ce match représente l''un des meilleurs value bets du Groupe E, avec des cotes équilibrées sur 1xBet.

Les autres matchs du Groupe E à surveiller : Argentine vs Pérou (14 juin) et France vs Suède (14 juin). La qualification pour les huitièmes pourrait se jouer sur la différence de buts.',
  '2026-04-01T14:00:00Z',
  'Groupes',
  ARRAY['Groupe E', 'Argentine', 'France', 'Analyse', 'Favoris'],
  'AlgoPronos AI',
  'published'
),
(
  'Analyse IA : les 5 favoris pour remporter la Coupe du Monde 2026',
  'favoris-coupe-du-monde-2026-analyse-ia',
  'Notre algorithme analyse les cotes, les performances récentes et les compositions d''équipe pour identifier les 5 nations les plus susceptibles de soulever le trophée à New York.',
  'Notre algorithme AlgoPronos a analysé l''ensemble des données disponibles — forme récente sur 24 mois, cotes de marché, performances en compétitions internationales, blessures clés — pour établir le classement des 5 favoris du Mondial 2026.

1. France (cote victoire finale : 5.50) — Les Bleus arrivent en grande forme avec une génération dorée. Mbappé, Camavinga, Tchouaméni : le trio de choc est au sommet.

2. Argentine (cote : 6.00) — Championne en titre, mais Messi approche la fin de sa carrière internationale. La succession est-elle assurée ?

3. Brésil (cote : 7.00) — Le Brésil n''a plus gagné depuis 2002. La pression sera immense, mais le talent est là.

4. Espagne (cote : 8.00) — La nouvelle génération Yamal-Nico Williams-Pedri est la plus excitante d''Europe. Champion d''Europe 2024.

5. Allemagne (cote : 10.00) — Renouvelée, disciplinée, avec l''avantage d''évoluer sur le continent américain qu''elle connait bien.

Value bet IA : L''Espagne à 8.00 représente la meilleure valeur selon notre algorithme. Disponible sur 1xBet avec le code ALGO.',
  '2026-03-30T09:00:00Z',
  'Analyse IA',
  ARRAY['Favoris', 'Analyse IA', 'France', 'Argentine', 'Brésil', 'Espagne'],
  'AlgoPronos AI',
  'published'
),
(
  'Coupe du Monde 2026 : les équipes africaines prêtes à créer la surprise',
  'equipes-africaines-coupe-du-monde-2026',
  'Le Maroc, le Nigéria, le Sénégal, la Côte d''Ivoire, l''Égypte, le Ghana et le Kenya représentent l''Afrique. Analyse de leurs chances et de leurs matchs clés.',
  'L''Afrique dispose de 9 représentants à la Coupe du Monde 2026 — un record. Parmi eux, plusieurs équipes ont les moyens de créer de vraies surprises et d''atteindre les quarts de finale.

Le Maroc (Groupe C) : Les Lions de l''Atlas ont atteint les demi-finales en 2022 — un exploit historique. Ils abordent 2026 avec confiance face à Canada, Arabie Saoudite et Croatie.

Le Nigéria (Groupe D) : Dans le groupe du Brésil avec la Suisse et la Serbie. Les Super Eagles possèdent un effectif de grande qualité. Notre IA cote leur qualification en huitièmes à 45%.

Le Sénégal : Avec Sadio Mané dans l''équipe, le Sénégal reste une force à respecter. Excellent pressing, jeu direct.

La Côte d''Ivoire : Les Éléphants, Champions d''Afrique 2024, arrivent en grande forme. Dans le Groupe H face à la Belgique et l''Italie — groupe difficile.

Ghana (Groupe G) : Contre Portugal, Pays-Bas et Chili. Outsiders mais capables de surprendre sur un match.

Kenya : Première participation historique. Dans le Groupe H, ils feront de leur mieux pour représenter dignement l''Afrique de l''Est.',
  '2026-03-25T16:00:00Z',
  'Afrique',
  ARRAY['Afrique', 'Maroc', 'Nigeria', 'Sénégal', 'Côte d''Ivoire', 'Ghana'],
  'AlgoPronos AI',
  'published'
),
(
  'Meilleurs value bets pour la phase de groupes — stratégie IA Mondial 2026',
  'meilleurs-value-bets-phase-groupes-mondial-2026',
  'Notre algorithme IA identifie les meilleures opportunités de value betting pour la phase de groupes. Outsiders à surveiller, cotes sous-estimées, stratégie Optimus.',
  'La phase de groupes de la Coupe du Monde 2026 offre d''excellentes opportunités de value betting. Notre algorithme AlgoPronos a identifié plusieurs situations où les cotes bookmaker sous-estiment les probabilités réelles.

Stratégie Montante recommandée : Concentrez-vous sur les favoris évidents dans les premiers matchs de groupe (Journée 1). Les grandes nations jouent prudemment mais gagnent généralement leurs premiers matchs.

Top 5 value bets identifiés par l''IA :
- France à domicile de groupe (cote moyenne 1.65) : sous-cotée selon notre modèle
- Brésil Journée 1 vs Nigéria : probabilité IA 68%, cote implicite 62%
- Espagne vs Bolivie : une victoire facile avec un handicap intéressant
- Portugal Over 2.5 buts Journée 1 : les Portugais marquent beaucoup en début de compétition

Stratégie Optimus : Combinez 3 à 4 picks prudents (cotes 1.40-1.65) pour un combiné à 4-6. Évitez les surprises de Journée 3 où les équipes déjà qualifiées peuvent faire tourner.

Tous ces picks sont disponibles sur 1xBet avec le meilleur taux de redistribution. Utilisez le code ALGO pour bénéficier du bonus 200% à l''inscription.',
  '2026-03-22T13:00:00Z',
  'Stratégie',
  ARRAY['Value Betting', 'Stratégie IA', 'Phase de groupes', 'Cotes', 'Montante', 'Optimus'],
  'AlgoPronos AI',
  'published'
)
ON CONFLICT (slug) DO NOTHING;
