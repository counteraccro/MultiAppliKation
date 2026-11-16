import { describe, expect, it } from 'vitest';
import { AccordSession } from './accord-session';
import { accordBelt, ACCORDS, boxesOf, isRight, isTrap, parseAccord, pickAccords, prefillOf, sentenceOf, shown, startSentence, SWAP, tipAt, tipFor } from './accords';

/**
 * Les fiches Charivari recopiées à part : la phrase de départ et sa correction (n° 1 à 114). Les données de
 * l'app doivent redonner exactement les mêmes. « La barque charive » (n° 11) est corrigée ici aussi.
 */
const FICHES: Record<string, [string, string]> = {
  'blanche.1': ['L’avion décolle.', 'Les avions décollent.'],
  'blanche.2': ['Le chien aboie.', 'Les chiens aboient.'],
  'blanche.3': ['Une abeille butinait.', 'Des abeilles butinaient.'],
  'blanche.4': ['Le camion freine.', 'Les camions freinent.'],
  'blanche.5': ['Le coiffeur travaillait.', 'Les coiffeurs travaillaient.'],
  'blanche.6': ['Un aigle volait.', 'Des aigles volaient.'],
  'blanche.7': ['Le bébé gazouillait.', 'Les bébés gazouillaient.'],
  'blanche.8': ['Un train passe.', 'Des trains passent.'],
  'blanche.9': ['La radio fonctionne.', 'Les radios fonctionnent.'],
  'blanche.10': ['La pie jacasse.', 'Les pies jacassent.'],
  'blanche.11': ['Un garçon jouait.', 'Des garçons jouaient.'],
  'blanche.12': ['Le moteur explose.', 'Les moteurs explosent.'],
  'blanche.13': ['La chouette dormait.', 'Les chouettes dormaient.'],
  'blanche.14': ['La voiture roule.', 'Les voitures roulent.'],
  'blanche.15': ['Un danseur sautille.', 'Des danseurs sautillent.'],
  'blanche.16': ['Le singe mange.', 'Les singes mangent.'],
  'blanche.17': ['Une fleur pousse.', 'Des fleurs poussent.'],
  'blanche.18': ['L’homme travaillait.', 'Les hommes travaillaient.'],
  'blanche.19': ['Des chats griffent.', 'Un chat griffe.'],
  'blanche.20': ['Les horloges sonnaient.', 'L’horloge sonnait.'],
  'blanche.21': ['Les enfants arrivent.', 'L’enfant arrive.'],
  'blanche.22': ['Les coureurs gagnent.', 'Le coureur gagne.'],
  'blanche.23': ['Les filles chantent.', 'La fille chante.'],
  'blanche.24': ['Des billes roulaient.', 'Une bille roulait.'],
  'blanche.25': ['Les touristes bronzent.', 'Le touriste bronze.'],
  'blanche.26': ['Les garçons lisaient.', 'Le garçon lisait.'],
  'blanche.27': ['Des chenilles se transforment.', 'Une chenille se transforme.'],
  'blanche.28': ['Les trains arrivent.', 'Le train arrive.'],
  'blanche.29': ['Les plongeurs zigzaguaient.', 'Le plongeur zigzaguait.'],
  'blanche.30': ['Les perroquets parlent.', 'Le perroquet parle.'],
  'blanche.31': ['Les barques chavirent.', 'La barque chavire.'],
  'blanche.32': ['Les mouettes plongent.', 'La mouette plonge.'],
  'blanche.33': ['Des bougies brûlaient.', 'Une bougie brûlait.'],
  'blanche.34': ['Les enfants crient.', 'L’enfant crie.'],
  'blanche.35': ['Des lions dormaient.', 'Un lion dormait.'],
  'blanche.36': ['Les gazelles couraient.', 'La gazelle courait.'],
  'jaune.1': ['Il regardait la grosse araignée.', 'Ils regardaient les grosses araignées.'],
  'jaune.2': ['Son frère était sportif et travailleur.', 'Ses frères étaient sportifs et travailleurs.'],
  'jaune.3': ['Le facteur apporte une lettre.', 'Les facteurs apportent des lettres.'],
  'jaune.4': ['Les petits chats couraient après les oiseaux.', 'Le petit chat courait après l’oiseau.'],
  'jaune.5': ['Ils habitaient de belles maisons.', 'Il habitait une belle maison.'],
  'jaune.6': ['Les singes sautent de branche en branche.', 'Le singe saute de branche en branche.'],
  'jaune.7': ['Lina semble fatiguée ce matin.', 'Enzo semble fatigué ce matin.'],
  'jaune.8': ['Lina était une princesse charmante.', 'Enzo était un prince charmant.'],
  'jaune.9': ['Lina est devenue championne de judo.', 'Enzo est devenu champion de judo.'],
  'jaune.10': ['Le magicien maladroit rate le tour.', 'Les magiciens maladroits ratent les tours.'],
  'jaune.11': ['L’étoile filante était très brillante.', 'Les étoiles filantes étaient très brillantes.'],
  'jaune.12': ['Je suis très content d’avoir réussi.', 'Nous sommes très contents d’avoir réussi.'],
  'jaune.13': ['Des comètes visibles à l’œil nu sont rares.', 'Une comète visible à l’œil nu est rare.'],
  'jaune.14': ['Ils sont passés maitres dans l’art du dessin.', 'Il est passé maitre dans l’art du dessin.'],
  'jaune.15': ['Les éruptions volcaniques peuvent être meurtrières.', 'L’éruption volcanique peut être meurtrière.'],
  'jaune.16': ['Anna n’est jamais arrivée en retard.', 'Tom n’est jamais arrivé en retard.'],
  'jaune.17': ['Anna semblait perdue dans ses pensées.', 'Tom semblait perdu dans ses pensées.'],
  'jaune.18': ['Anna est devenue maitresse d’école.', 'Tom est devenu maitre d’école.'],
  'orange.1': ['Enthousiaste, ce maitre prépare une séance ludique et intéressante !', 'Enthousiastes, ces maitres préparent des séances ludiques et intéressantes !'],
  'orange.2': ['Il a un crayon rouge neuf.', 'Ils ont des crayons rouges neufs.'],
  'orange.3': ['Son ancien stylo préféré ne fonctionnait plus.', 'Ses anciens stylos préférés ne fonctionnaient plus.'],
  'orange.4': ['Elle a une petite main potelée.', 'Elles ont des petites mains potelées.'],
  'orange.5': ['Ce grand paquet encombre ma petite étagère étroite.', 'Ces grands paquets encombrent mes petites étagères étroites.'],
  'orange.6': ['Je n’arrive pas à faire cet exercice long et difficile.', 'Nous n’arrivons pas à faire ces exercices longs et difficiles.'],
  'orange.7': ['Tu ne traverses jamais sur ce passage piéton !', 'Vous ne traversez jamais sur ces passages piétons !'],
  'orange.8': ['Ta cousine a une jolie maison fleurie.', 'Tes cousines ont des jolies maisons fleuries.'],
  'orange.9': ['Apeuré, notre jeune chien aboie sur cette personne inconnue.', 'Apeurés, nos jeunes chiens aboient sur ces personnes inconnues.'],
  'orange.10': ['Effrayés, ces canards bruyants cancanent.', 'Effrayé, ce canard bruyant cancane.'],
  'orange.11': ['Les poissons ont peur des grands requins blancs.', 'Le poisson a peur du grand requin blanc.'],
  'orange.12': ['Tes nouveaux livres ne parlent ni de ces personnages, ni de ces villages !', 'Ton nouveau livre ne parle ni de ce personnage, ni de ce village !'],
  'orange.13': ['Ces fillettes ramassent les fruits mûrs et sucrés.', 'Cette fillette ramasse le fruit mûr et sucré.'],
  'orange.14': ['Mes maitresses ont des idées farfelues mais intéressantes !', 'Ma maitresse a une idée farfelue mais intéressante !'],
  'orange.15': ['Fatigués, ces soldats écrivaient de nouvelles lettres émouvantes.', 'Fatigué, ce soldat écrivait une nouvelle lettre émouvante.'],
  'orange.16': ['Inquiets, les policiers surveillent ces suspects.', 'Inquiet, le policier surveille ce suspect.'],
  'orange.17': ['Nous effaçons ces traces sur vos vieilles tables abimées.', 'J’efface cette trace sur votre vieille table abimée.'],
  'orange.18': ['Ils ne révisent guère les nouvelles leçons !', 'Il ne révise guère la nouvelle leçon !'],
  'orange.19': ['cet invité / l’employé / votre ami', 'cette invitée / l’employée / votre amie'],
  'orange.20': ['le gardien / ce collégien / un musicien', 'la gardienne / cette collégienne / une musicienne'],
  'orange.21': ['cet acteur / notre animateur / un navigateur', 'cette actrice / notre animatrice / une navigatrice'],
  'orange.22': ['mon boucher / un droitier / le sorcier', 'ma bouchère / une droitière / la sorcière'],
  'orange.23': ['un menteur / le dompteur / un chercheur', 'une menteuse / la dompteuse / une chercheuse'],
  'orange.24': ['immortel / mensuel / réel / naturel', 'immortelle / mensuelle / réelle / naturelle'],
  'orange.25': ['Le directeur discute avec notre maitre.', 'La directrice discute avec notre maitresse.'],
  'orange.26': ['Le spectateur applaudit ce nouveau comédien talentueux.', 'La spectatrice applaudit cette nouvelle comédienne talentueuse.'],
  'orange.27': ['Son chien désobéissant grogne sur ton fils apeuré.', 'Sa chienne désobéissante grogne sur ta fille apeurée.'],
  'orange.28': ['Ce pharmacien est très professionnel.', 'Cette pharmacienne est très professionnelle.'],
  'orange.29': ['Mon moniteur d’équitation est phénoménal !', 'Ma monitrice d’équitation est phénoménale !'],
  'orange.30': ['Cet étranger semble perdu et inquiet.', 'Cette étrangère semble perdue et inquiète.'],
  'orange.31': ['Je veux devenir un informaticien exceptionnel !', 'Je veux devenir une informaticienne exceptionnelle !'],
  'orange.32': ['Ce jeune homme sera apprenti-boulanger.', 'Cette jeune femme sera apprentie-boulangère.'],
  'orange.33': ['Mon ancien instituteur passionné enseigne toujours ici.', 'Mon ancienne institutrice passionnée enseigne toujours ici.'],
  'orange.34': ['Quentin est un grand magicien…', 'Éléa est une grande magicienne…'],
  'orange.35': ['Quentin semble motivé et travailleur.', 'Éléa semble motivée et travailleuse.'],
  'orange.36': ['Quentin deviendra un ouvrier qualifié.', 'Éléa deviendra une ouvrière qualifiée.'],
  'rose.1': ['Le cheval blanc trotte puis galope.', 'Les chevaux blancs trottent puis galopent.'],
  'rose.2': ['Son genou ne semblait pas gonflé. Il était bleu.', 'Ses genoux ne semblaient pas gonflés. Ils étaient bleus.'],
  'rose.3': ['L’écolier ouvre et entre par le grand portail vert.', 'Les écoliers ouvrent et entrent par les grands portails verts.'],
  'rose.4': ['Le seigneur construit ce magnifique château fortifié puis habite dans le donjon.', 'Les seigneurs construisent ces magnifiques châteaux fortifiés puis habitent dans les donjons.'],
  'rose.5': ['Le tournoi médiéval est très attendu.', 'Les tournois médiévaux sont très attendus.'],
  'rose.6': ['La reine admire le favori mais n’encourage pas le perdant.', 'Les reines admirent les favoris mais n’encouragent pas les perdants.'],
  'rose.7': ['Les souris grises vivent dans les vastes plaines.', 'La souris grise vit dans la vaste plaine.'],
  'rose.8': ['Les travaux de ces maçons ne commencent pas avant janvier et se terminent en mars.', 'Le travail de ce maçon ne commence pas avant janvier et se termine en mars.'],
  'rose.9': ['Les longs nez roses des cochons sont les groins ou les museaux.', 'Le long nez rose du cochon est le groin ou le museau.'],
  'rose.10': ['Les hiboux sont des animaux nocturnes carnivores.', 'Le hibou est un animal nocturne carnivore.'],
  'rose.11': ['Les plats cuisinés étaient conservés dans des bocaux puis savourés.', 'Le plat cuisiné était conservé dans un bocal puis savouré.'],
  'rose.12': ['Des grosses miettes tombent sur mes jambes et les salissent.', 'Une grosse miette tombe sur ma jambe et la salit.'],
  'rose.13': ['Snoopy est un cheval capricieux.', 'Didoune est une jument capricieuse.'],
  'rose.14': ['Snoopy est un loup un peu fou.', 'Didoune est une louve un peu folle.'],
  'rose.15': ['Snoopy est un coq compétitif.', 'Didoune est une poule compétitive.'],
  'rose.16': ['Le chat blanc et agressif s’enfuit.', 'La chatte blanche et agressive s’enfuit.'],
  'rose.17': ['Le garçon mignon monte le cheval brun.', 'La fille mignonne monte la jument brune.'],
  'rose.18': ['L’affreux canard et le coq maladif picorent.', 'L’affreuse cane et la poule maladive picorent.'],
  'vert-clair.1': ['L’éléphant entend très bien grâce à ses grandes oreilles et il a un bon odorat grâce à sa trompe. On dit que l’éléphant a peur de la souris !', 'Les éléphants entendent très bien grâce à leurs grandes oreilles et ils ont un bon odorat grâce à leur trompe. On dit que les éléphants ont peur des souris !'],
  'vert-clair.2': ['Les crocodiles sont de redoutables prédateurs. Ils attrapent leurs proies avec leurs larges mâchoires. Les crocodiles peuvent vivre très vieux. En captivité, ils peuvent même dépasser l’âge de 100 ans !', 'Le crocodile est un redoutable prédateur. Il attrape ses proies avec ses larges mâchoires. Le crocodile peut vivre très vieux. En captivité, il peut même dépasser l’âge de 100 ans !'],
  'vert-clair.3': ['Les crocodiles sont sensibles aux vibrations dans l’eau. Leurs yeux sont situés en haut de leur tête.', 'Le crocodile est sensible aux vibrations dans l’eau. Ses yeux sont situés en haut de sa tête.'],
  'vert-clair.4': ['L’éléphant est le plus gros animal terrestre du monde. L’éléphant d’Afrique mesure 4 mètres de haut.', 'Les éléphants sont les plus gros animaux terrestres du monde. Les éléphants d’Afrique mesurent 4 mètres de haut.'],
  'vert-clair.5': ['Le renard est rusé. Il est souvent associé à la ruse dans les contes. Il est craintif et parfois cruel. Le renard vit généralement en groupe, il est carnivore et aussi très sociable.', 'La renarde est rusée. Elle est souvent associée à la ruse dans les contes. Elle est craintive et parfois cruelle. La renarde vit généralement en groupe, elle est carnivore et aussi très sociable.'],
  'vert-clair.6': ['La limace est un animal au corps mou. Sa bouche contient une langue garnie de dents. Elle n’est pas l’amie du jardinier car elle dévore les jeunes plants !', 'Les limaces sont des animaux au corps mou. Leur bouche contient une langue garnie de dents. Elles ne sont pas les amies du jardinier car elles dévorent les jeunes plants !'],
  'vert-clair.7': ['Tous les ânes ont de grandes oreilles refroidissantes. L’âne est têtu mais très intelligent.', 'Toutes les ânesses ont de grandes oreilles refroidissantes. L’ânesse est têtue mais très intelligente.'],
  'vert-clair.8': ['L’âne est plus petit que son cousin le cheval. Il reste l’ami de l’homme. Autrefois, l’âne était utilisé pour transporter des biens et des personnes.', 'L’ânesse est plus petite que son cousin le cheval. Elle reste l’amie de l’homme. Autrefois, l’ânesse était utilisée pour transporter des biens et des personnes.'],
  'vert-clair.9': ['Les girafes vivent entre quinze et vingt ans. Leur cou mesure à lui tout seul deux mètres !', 'La girafe vit entre quinze et vingt ans. Son cou mesure à lui tout seul deux mètres !'],
  'vert-clair.10': ['Les girafes ont un long cou et ne parlent pas. Elles peuvent mesurer jusqu’à cinq mètres de haut !', 'La girafe a un long cou et ne parle pas. Elle peut mesurer jusqu’à cinq mètres de haut !'],
  'vert-clair.11': ['L’alligator adulte est très féroce. Il défend son territoire et pond des œufs.', 'Les alligators adultes sont très féroces. Ils défendent leur territoire et pondent des œufs.'],
  'vert-clair.12': ['L’alligator a peur de l’homme. Il se jette dans l’eau pour se cacher. Il chasse.', 'Les alligators ont peur de l’homme. Ils se jettent dans l’eau pour se cacher. Ils chassent.'],
  'vert-clair.13': ['Le chat est le seul félin domestiqué. Il conserve toutefois son caractère sauvage.', 'Les chats sont les seuls félins domestiqués. Ils conservent toutefois leur caractère sauvage.'],
  'vert-clair.14': ['Le chat est un gros dormeur et il marque son territoire en laissant son odeur. Le chat est indépendant.', 'Les chats sont des gros dormeurs et ils marquent leur territoire en laissant leur odeur. Les chats sont indépendants.'],
  'vert-clair.15': ['Le cheval a été domestiqué par l’homme. Certains chevaux sont devenus célèbres !', 'La jument a été domestiquée par l’homme. Certaines juments sont devenues célèbres !'],
  'vert-clair.16': ['Le plus grand lion vit en Afrique où il a longtemps été chassé. Il est plus petit que le tigre.', 'La plus grande lionne vit en Afrique où elle a longtemps été chassée. Elle est plus petite que le tigre.'],
  'vert-clair.17': ['Le loup n’est pas dangereux pour l’homme. Il est présent dans beaucoup de légendes.', 'La louve n’est pas dangereuse pour l’homme. Elle est présente dans beaucoup de légendes.'],
  'vert-clair.18': ['Le chien est considéré comme le meilleur ami de l’homme. Sa fidélité est impressionnante !', 'Les chiens sont considérés comme les meilleurs amis de l’homme. Leur fidélité est impressionnante !'],
  'vert-fonce.1': ['La loutre est un mammifère semi-aquatique pratiquement nocturne. Elle est essentiellement piscivore. Elle se nourrit de différents poissons. Elle se reproduit à partir de 2 ou 3 ans.', 'Les loutres sont des mammifères semi-aquatiques pratiquement nocturnes. Elles sont essentiellement piscivores. Elles se nourrissent de différents poissons. Elles se reproduisent à partir de 2 ou 3 ans.'],
  'vert-fonce.2': ['Les trous noirs sont des objets dans l’univers très massifs mais beaucoup plus petits que les étoiles. Ils engloutissent tout ce qui se trouve à leur proximité, même la lumière.', 'Le trou noir est un objet dans l’univers très massif mais beaucoup plus petit que les étoiles. Il engloutit tout ce qui se trouve à sa proximité, même la lumière.'],
  'vert-fonce.3': ['Papa n’avait vraiment pas le moral, alors Réglisse a été contente qu’il propose d’emmener Albert au parc.', 'Maman n’avait vraiment pas le moral, alors Charles et Réglisse ont été contents qu’elle propose d’emmener Albert au parc.'],
  'vert-fonce.4': ['Toufou était extrêmement impatient de sortir. Il a rencontré une chienne et a reniflé son derrière ! Il réagit toujours comme cela quand il rencontre une inconnue.', 'Toufou et Rex étaient extrêmement impatients de sortir. Ils ont rencontré une chienne et ont reniflé son derrière ! Ils réagissent toujours comme cela quand ils rencontrent une inconnue.'],
  'vert-fonce.5': ['À la récré, Noé a parlé à un garçon. Il a joué avec lui. Il a bien aimé, finalement, ce premier jour d’école !', 'À la récré, Noé et Victor ont parlé à un garçon. Ils ont joué avec lui. Ils ont bien aimé, finalement, ce premier jour d’école !'],
  'vert-fonce.6': ['Le Grec a été un bon marin. Il partait vraiment loin en mer. Il a rapporté des marchandises et a beaucoup perfectionné sa technique de navigation.', 'Les Grecs ont été de bons marins. Ils partaient vraiment loin en mer. Ils ont rapporté des marchandises et ont beaucoup perfectionné leur technique de navigation.'],
  'vert-fonce.7': ['L’homme préhistorique se réunissait notamment dans des grottes. Puis, il a bâti des villages, a cultivé des champs et a élevé des animaux.', 'Les hommes préhistoriques se réunissaient notamment dans des grottes. Puis, ils ont bâti des villages, ont cultivé des champs et ont élevé des animaux.'],
  'vert-fonce.8': ['Le pharaon est le roi d’Égypte. Il s’enrichit grâce au travail des paysans. Il est tellement puissant qu’il est considéré comme un dieu vivant.', 'Les pharaons sont les rois d’Égypte. Ils s’enrichissent grâce au travail des paysans. Ils sont tellement puissants qu’ils sont considérés comme des dieux vivants.'],
  'vert-fonce.9': ['Le premier empereur de Chine était vraiment puissant et cruel ! Il a fait édifier des palais somptueux. L’empereur a fait construire la Grande Muraille de Chine.', 'Les premières impératrices de Chine étaient vraiment puissantes et cruelles ! Elles ont fait édifier des palais somptueux. Les impératrices ont fait construire la Grande Muraille de Chine.'],
  'vert-fonce.10': ['Le tigre n’a pas peur de l’eau. Il nage très bien. Le tigre rugit et souffle. C’est le plus grand des félins et ses crocs sont énormes.', 'Les tigres n’ont pas peur de l’eau. Ils nagent très bien. Les tigres rugissent et soufflent. Ce sont les plus grands des félins et leurs crocs sont énormes.'],
  'vert-fonce.11': ['Le coquillage est la « maison » que se construit le mollusque (animal à corps mou) pour se protéger. Le coquillage grandit en même temps que le corps de l’animal.', 'Les coquillages sont les « maisons » que se construisent les mollusques (animaux à corps mou) pour se protéger. Les coquillages grandissent en même temps que le corps des animaux.'],
  'vert-fonce.12': ['Les poissons vivent exclusivement dans l’eau. Ils se déplacent grâce à leurs nageoires. Couverts d’écailles, ils sont parfaitement adaptés à la vie aquatique. Les poissons grandissent toute leur vie.', 'La carpe vit exclusivement dans l’eau. Elle se déplace grâce à ses nageoires. Couverte d’écailles, elle est parfaitement adaptée à la vie aquatique. La carpe grandit toute sa vie.'],
  'bleu-clair.1': ['Mon frère, prêt pour l’école, portait son cartable.', 'Mes frères, prêts pour l’école, portaient leur cartable.'],
  'bleu-clair.2': ['Ma sœur est devenue journaliste.', 'Mes sœurs sont devenues journalistes.'],
  'bleu-clair.3': ['Cette série, c’est ma préférée.', 'Ces séries, ce sont mes préférées.'],
  'bleu-clair.4': ['Le chat est poursuivi par le chien.', 'Les chats sont poursuivis par les chiens.'],
  'bleu-clair.5': ['Le docteur, le seul de la région, vient examiner le malade.', 'Les docteurs, les seuls de la région, viennent examiner les malades.'],
  'bleu-clair.6': ['Ma sœur est allée au marché.', 'Mes sœurs sont allées au marché.'],
  'bleu-clair.7': ['C’est la matière que je préfère !', 'Ce sont les matières que je préfère !'],
  'bleu-clair.8': ['Le seigneur, entouré par sa cour, regardera le tournoi.', 'Les seigneurs, entourés par leur cour, regarderont le tournoi.'],
  'bleu-clair.9': ['Le grain est picoré par la poule.', 'Les grains sont picorés par les poules.'],
  'bleu-clair.10': ['Le postier, comme tous les matins, fait sa tournée. Il est précis, déterminé et rapide. Il est allé partout pour la distribution. C’est un homme appliqué.', 'Les postiers, comme tous les matins, font leur tournée. Ils sont précis, déterminés et rapides. Ils sont allés partout pour la distribution. Ce sont des hommes appliqués.'],
  'bleu-clair.11': ['Les fraises, présentes dans le jardin, sont très bonnes. Elles sont juteuses et sucrées. Elles sont ramassées avec délicatesse. Ce sont de vraies merveilles !', 'La fraise, présente dans le jardin, est très bonne. Elle est juteuse et sucrée. Elle est ramassée avec délicatesse. C’est une vraie merveille !'],
  'bleu-clair.12': ['Le cheval a été, il y a longtemps, domestiqué par l’homme. Il est grand, intelligent, sensible et loyal. Il est le meilleur ami de l’homme.', 'La jument a été, il y a longtemps, domestiquée par l’homme. Elle est grande, intelligente, sensible et loyale. Elle est la meilleure amie de l’homme.'],
  'bleu-clair.13': ['Les lapins sont entrés dans le terrier.', 'Le lapin est entré dans le terrier.'],
  'bleu-clair.14': ['Les loups, à la tombée de la nuit, hurleront à la lune.', 'Le loup, à la tombée de la nuit, hurlera à la lune.'],
  'bleu-clair.15': ['Ce sont mes meilleures amies !', 'C’est ma meilleure amie !'],
  'bleu-clair.16': ['Mes frères, après le repas, font la vaisselle.', 'Mon frère, après le repas, fait la vaisselle.'],
  'bleu-clair.17': ['Tes amies sont parties en voyage.', 'Ton amie est partie en voyage.'],
  'bleu-clair.18': ['Les chiens, impatients de sortir, regardaient par la fenêtre et jappaient.', 'Le chien, impatient de sortir, regardait par la fenêtre et jappait.'],
  'bleu-clair.19': ['Ce sont des jupes soldées.', 'C’est une jupe soldée.'],
  'bleu-clair.20': ['Les lionnes, ces femelles puissantes, chassent.', 'La lionne, cette femelle puissante, chasse.'],
  'bleu-clair.21': ['Les yeux étincelants, pétillants de bonheur, sont beaux à regarder.', 'L’œil étincelant, pétillant de bonheur, est beau à regarder.'],
  'bleu-clair.22': ['Ce garçon, tous les matins, arrive débrayé et décoiffé à l’école.', 'Cette fille, tous les matins, arrive débrayée et décoiffée à l’école.'],
  'bleu-clair.23': ['Il est parti en voyage avec ses amis.', 'Elle est partie en voyage avec ses amies.'],
  'bleu-clair.24': ['Le coq est mangé par le renard.', 'La poule est mangée par la renarde.'],
  'bleu-clair.25': ['Le maitre est gentil, agréable et toujours ponctuel.', 'La maitresse est gentille, agréable et toujours ponctuelle.'],
  'bleu-clair.26': ['Il est pourtant arrivé en retard, complètement décoiffé et il était énervé de cela.', 'Elle est pourtant arrivée en retard, complètement décoiffée et elle était énervée de cela.'],
  'bleu-clair.27': ['Le loup, blessé et affamé, est caché dans la forêt.', 'La louve, blessée et affamée, est cachée dans la forêt.'],
  'bleu-clair.28': ['Il était allé chasser et est rentré bredouille.', 'Elle était allée chasser et est rentrée bredouille.'],
  'bleu-clair.29': ['Le lapin est chassé par le chat.', 'La lapine est chassée par la chatte.'],
  'bleu-fonce.1': ['La comète est un astre brillant. Elle est comme une boule de neige et quand elle s’approche du soleil, la glace fond. Formée de grains de poussière et de gaz, elle est accompagnée d’une traînée.', 'Les comètes sont des astres brillants. Elles sont comme des boules de neige et quand elles s’approchent du soleil, la glace fond. Formées de grains de poussière et de gaz, elles sont accompagnées d’une traînée.'],
  'bleu-fonce.2': ['Issu de l’évaporation de l’eau, il fait partie du cycle de l’eau. Il en existe de plusieurs sortes. Le nuage est composé essentiellement d’eau et se déplace en étant poussé par les vents.', 'Issus de l’évaporation de l’eau, ils font partie du cycle de l’eau. Il en existe de plusieurs sortes. Les nuages sont composés essentiellement d’eau et se déplacent en étant poussés par les vents.'],
  'bleu-fonce.3': ['Georges détestait Grandma. C’était une vieille femme grincheuse et égoïste qui avait des dents jaunes. Elle était râleuse et passait ses journées assise en se balançant dans un fauteuil. Grandma était méchante et très capricieuse. Serait-elle une affreuse sorcière ?', 'Georges détestait Grandpa. C’était un vieil homme grincheux et égoïste qui avait des dents jaunes. Il était râleur et passait ses journées assis en se balançant dans un fauteuil. Grandpa était méchant et très capricieux. Serait-il un affreux sorcier ?'],
  'bleu-fonce.4': ['Il est souvent souhaité, demandé, et même exigé. Chaque fois, l’effort doit être régulier, soutenu, important, en un mot, réel. Encouragé ou pas, il demande parfois un effort surhumain !', 'Elle est souvent souhaitée, demandée, et même exigée. Chaque fois, la volonté doit être régulière, soutenue, importante, en un mot, réelle. Encouragée ou pas, elle demande parfois une volonté surhumaine !'],
  'bleu-fonce.5': ['Fabrice est apprenti acrobate. Il prépare un spectacle. Sur scène, vêtu d’un accoutrement coloré, il effectue des pirouettes en sautant sur un fil. Le public applaudit ses efforts.', 'Fabrice et Julien sont apprentis acrobates. Ils préparent un spectacle. Sur scène, vêtus d’un accoutrement coloré, ils effectuent des pirouettes en sautant sur un fil. Le public applaudit leurs efforts.'],
  'bleu-fonce.6': ['Acheté en kiosque, envoyé aux abonnés, ou distribué sur le quai des gares, le journal a toujours du succès. Peuplé d’évènements sportifs, d’actualité ou bien de mode, il trouve acquéreur. Il finit souvent en étant jeté à la poubelle.', 'Achetées en kiosque, envoyées aux abonnés, ou distribuées sur le quai des gares, les revues ont toujours du succès. Peuplées d’évènements sportifs, d’actualité ou bien de mode, elles trouvent acquéreur. Elles finissent souvent en étant jetées à la poubelle.'],
  'bleu-fonce.7': ['Les deux enfants dont parl… Kélian habit… ici. Les souvenirs que racont… ma grand-mère étai… toujours passionnan….', 'Les deux enfants dont parle Kélian habitent ici. Les souvenirs que raconte ma grand-mère étaient toujours passionnants.'],
  'bleu-fonce.8': ['Les valises que recherch… Fanny pour son voyage se trouv… au grenier. Mia et Eglantine admir… les photos des pays que visit… François.', 'Les valises que recherche Fanny pour son voyage se trouvent au grenier. Mia et Eglantine admirent les photos des pays que visite François.'],
  'bleu-fonce.9': ['Les pandas géants vivent en Chine, cachés dans la montagne. En hiver, les pandas s’amusent en se roulant dans la neige. Malgré leurs 130 kilos, ils sont très bons grimpeurs. Ils ne sont pas comme les ours qui dorment tout l’hiver ; ils n’hibernent pas.', 'Le panda géant vit en Chine, caché dans la montagne. En hiver, le panda s’amuse en se roulant dans la neige. Malgré ses 130 kilos, il est très bon grimpeur. Il n’est pas comme l’ours qui dort tout l’hiver ; il n’hiberne pas.'],
  'bleu-fonce.10': ['L’île Maurice a autrefois abrité des animaux aujourd’hui disparus : les dodos. Les dodos étaient des oiseaux coureurs de la famille des pigeons. Ils ressemblaient à une grosse dinde. Ils étaient dotés de deux pattes jaunes et d’un plumage sombre.', 'L’île Maurice a autrefois abrité un animal aujourd’hui disparu : le dodo. Le dodo était un oiseau coureur de la famille des pigeons. Il ressemblait à une grosse dinde. Il était doté de deux pattes jaunes et d’un plumage sombre.'],
  'bleu-fonce.11': ['C’est alors que je remarquais un type à l’allure bizarre, assis juste en face de moi, et qui me regardait. Un peu caché par un autre client, je voyais qu’il était grand et rond, bronzé et très musclé. La joue de cet homme était déformée par une cicatrice lui barrant le visage.', 'C’est alors que je remarquais une femme à l’allure bizarre, assise juste en face de moi, et qui me regardait. Un peu cachée par un autre client, je voyais qu’elle était grande et ronde, bronzée et très musclée. La joue de cette femme était déformée par une cicatrice lui barrant le visage.'],
  'bleu-fonce.12': ['Les chèvres sont de petits animaux très agiles. On les trouve dans toutes les régions du globe. Herbivores, elles se nourrissent en broutant toutes sortes de végétaux. Ces bonnes grimpeuses sont élevées depuis longtemps pour leur lait.', 'La chèvre est un petit animal très agile. On la trouve dans toutes les régions du globe. Herbivore, elle se nourrit en broutant toutes sortes de végétaux. Cette bonne grimpeuse est élevée depuis longtemps pour son lait.'],
  'violette.1': ['C’est l’hiver, Paul le fermier donne de la nourriture à la vache : il lui remplit la mangeoire de foin. Bien nourrie, la vache pourra donner du lait de bonne qualité. La vache est élevée pour la production laitière. Elle a passé l’été dans les pâturages.', 'C’est l’hiver, Paul le fermier donne de la nourriture aux vaches : il leur remplit la mangeoire de foin. Bien nourries, les vaches pourront donner du lait de bonne qualité. Les vaches sont élevées pour la production laitière. Elles ont passé l’été dans les pâturages.'],
  'violette.2': ['En entrant dans la forêt, le petit Poucet a déposé un caillou sur le chemin. En s’enfonçant dans le bois, il a continué à semer un caillou tout au long de sa marche. Perdus au cœur du bois, le petit Poucet et ses frères n’eurent plus qu’à suivre le chemin du retour de caillou en caillou.', 'En entrant dans la forêt, le petit Poucet a déposé des cailloux sur le chemin. En s’enfonçant dans le bois, il a continué à semer des cailloux tout au long de sa marche. Perdus au cœur du bois, le petit Poucet et ses frères n’eurent plus qu’à suivre le chemin du retour de cailloux en cailloux.'],
  'violette.3': ['L’horticulteur est un spécialiste qui cultive des plantes d’ornement. Tout son travail consiste à produire des arbres et des fleurs pour le jardinier et le fleuriste. Le jardinier cultive et entretient des plantes ornementales ou potagères. Le fleuriste achète et revend des fleurs pour les particuliers.', 'Les horticulteurs sont des spécialistes qui cultivent des plantes d’ornement. Tout leur travail consiste à produire des arbres et des fleurs pour les jardiniers et les fleuristes. Les jardiniers cultivent et entretiennent des plantes ornementales ou potagères. Les fleuristes achètent et revendent des fleurs pour les particuliers.'],
  'violette.4': ['La photosynthèse est le phénomène par lequel les plantes produisent des réserves de nourriture à partir de l’eau et du gaz carbonique de l’air. Ces réserves de nourriture sont appelées glucides. Les plantes fixent les glucides grâce à la chlorophylle, en employant comme source d’énergie la lumière solaire.', 'La photosynthèse est le phénomène par lequel la plante produit des réserves de nourriture à partir de l’eau et du gaz carbonique de l’air. Ces réserves de nourriture sont appelées glucides. La plante fixe les glucides grâce à la chlorophylle, en employant comme source d’énergie la lumière solaire.'],
  'violette.5': ['La musique a son alphabet, la note. La note donne le son (do, ré, mi, fa, sol, la, si) mais aussi le temps (noire, blanche, croche, etc.). La ligne d’écriture s’appelle la portée. L’ensemble des portées d’une œuvre s’appelle une partition. La note haute est représentée avec la clé de sol ; pour la note basse, c’est la clé de fa.', 'La musique a son alphabet, les notes. Les notes donnent le son (do, ré, mi, fa, sol, la, si) mais aussi le temps (noire, blanche, croche, etc.). La ligne d’écriture s’appelle la portée. L’ensemble des portées d’une œuvre s’appelle une partition. Les notes hautes sont représentées avec la clé de sol ; pour les notes basses, c’est la clé de fa.'],
  'violette.6': ['Cher oncle,\nJe te remercie pour la belle journée passée ensemble. C’était une joie de me promener avec toi en vélo à travers champs ! Tu m’as fait découvrir la campagne, les bosquets, la faune et la flore de ton petit pays. Même si la pluie a interrompu quelques instants les balades, j’ai tout aimé de cette journée bien agréable.', 'Cher oncle,\nJe te remercie pour les belles journées passées ensemble. C’était une joie de me promener avec toi en vélo à travers champs ! Tu m’as fait découvrir la campagne, les bosquets, la faune et la flore de ton petit pays. Même si la pluie a interrompu quelques instants les balades, j’ai tout aimé de ces journées bien agréables.'],
  'marron.1': ['Les pandas sont des mammifères volumineux et massifs. Ils se nourrissent essentiellement de bambous. Ils les cueillent en utilisant leur faux pouce et les mastiquent pendant plusieurs heures.', 'Le panda est un mammifère volumineux et massif. Il se nourrit essentiellement de bambous. Il les cueille en utilisant son faux pouce et les mastique pendant plusieurs heures.'],
  'marron.2': ['La petite voiture que j’ai achetée pour mon neveu est bleu foncé. S’il la frotte sur le sol, la soulève puis la repose, elle peut avancer toute seule. Va-t-elle lui plaire ?', 'Les petites voitures que j’ai achetées pour mon neveu sont bleu foncé. S’il les frotte sur le sol, les soulève puis les repose, elles peuvent avancer toutes seules. Vont-elles lui plaire ?'],
  'marron.3': ['Les médicaments que le médecin a prescrits n’étaient pas disponibles à la pharmacie du village. Vont-ils être présents à l’officine du centre commercial ?', 'Le médicament que le médecin a prescrit n’était pas disponible à la pharmacie du village. Va-t-il être présent à l’officine du centre commercial ?'],
  'marron.4': ['J’ai beaucoup apprécié la pièce de théâtre que j’ai vue au festival d’Avignon. Elle était interprétée par de jeunes acteurs très dynamiques. Je la recommande à mes amis.', 'J’ai beaucoup apprécié les pièces de théâtre que j’ai vues au festival d’Avignon. Elles étaient interprétées par de jeunes acteurs très dynamiques. Je les recommande à mes amis.'],
  'marron.5': ['Le chemin que nous avons emprunté à vélo est très sinueux. Les coureurs du Tour de France le connaissent bien. C’est un chemin sélectif qu’ils ont parcouru à de nombreuses reprises.', 'La route que nous avons empruntée à vélo est très sinueuse. Les coureurs du Tour de France la connaissent bien. C’est une route sélective qu’ils ont parcourue à de nombreuses reprises.'],
  'marron.6': ['Les cerises que j’ai ramassées ce matin sont bien mûres ! Elles seront utilisées pour faire des confitures.', 'Les abricots que j’ai ramassés ce matin sont bien mûrs ! Ils seront utilisés pour faire des confitures.'],
  'noire.1': ['À cause de mon moniteur de ski, j’ai raté ma troisième étoile. Il était nul ! Tellement mauvais que mon père l’a traité de bon à rien. Mon moniteur, ça l’a fait rigoler.', 'À cause de mes moniteurs de ski, j’ai raté ma troisième étoile. Ils étaient nuls ! Tellement mauvais que mon père les a traités de bons à rien. Mes moniteurs, ça les a fait rigoler.'],
  'noire.2': ['À cause de mon moniteur de ski, j’ai raté ma troisième étoile. Il était nul ! Tellement mauvais que mon père l’a traité de bon à rien. Mon moniteur, ça l’a fait rigoler.', 'À cause de ma monitrice de ski, j’ai raté ma troisième étoile. Elle était nulle ! Tellement mauvaise que mon père l’a traitée de bonne à rien. Ma monitrice, ça l’a fait rigoler.'],
  'noire.3': ['À cause de mon moniteur de ski, j’ai raté ma troisième étoile. Il était nul ! Tellement mauvais que mon père l’a traité de bon à rien. Mon moniteur, ça l’a fait rigoler.', 'À cause de mes monitrices de ski, j’ai raté ma troisième étoile. Elles étaient nulles ! Tellement mauvaises que mon père les a traitées de bonnes à rien. Mes monitrices, ça les a fait rigoler.'],
  'noire.4': ['Le texte que j’ai lu en classe ce matin était très compliqué. Il était imprimé sur un vieux papier jauni. Je l’ai trouvé trop long et ennuyeux. S’il était illustré, il serait plus attractif !', 'L’histoire que j’ai lue en classe ce matin était très compliquée. Elle était imprimée sur un vieux papier jauni. Je l’ai trouvée trop longue et ennuyeuse. Si elle était illustrée, elle serait plus attractive !'],
  'noire.5': ['Le texte que j’ai lu en classe ce matin était très compliqué. Il était imprimé sur un vieux papier jauni. Je l’ai trouvé trop long et ennuyeux. S’il était illustré, il serait plus attractif !', 'Les textes que j’ai lus en classe ce matin étaient très compliqués. Ils étaient imprimés sur un vieux papier jauni. Je les ai trouvés trop longs et ennuyeux. S’ils étaient illustrés, ils seraient plus attractifs !'],
  'noire.6': ['Mon vieux chemisier noir est devenu trop petit pour moi. Il est trop serré. Dommage, je l’ai tellement aimé, ce chemisier !', 'Ma vieille chemise noire est devenue trop petite pour moi. Elle est trop serrée. Dommage, je l’ai tellement aimée, cette chemise !'],
  'noire.7': ['Mon vieux chemisier noir est devenu trop petit pour moi. Il est trop serré. Dommage, je l’ai tellement aimé, ce chemisier !', 'Mes vieux chemisiers noirs sont devenus trop petits pour moi. Ils sont trop serrés. Dommage, je les ai tellement aimés, ces chemisiers !'],
  'noire.8': ['À cause de la grève, le courrier que j’ai écrit et posté hier n’est parti qu’aujourd’hui. Mon oncle était déçu de ne pas l’avoir reçu. Arrivera-t-il demain ?', 'À cause de la grève, la lettre que j’ai écrite et postée hier n’est partie qu’aujourd’hui. Mon oncle était déçu de ne pas l’avoir reçue. Arrivera-t-elle demain ?'],
  'noire.9': ['À cause de la grève, le courrier que j’ai écrit et posté hier n’est parti qu’aujourd’hui. Mon oncle était déçu de ne pas l’avoir reçu. Arrivera-t-il demain ?', 'À cause de la grève, les lettres que j’ai écrites et postées hier ne sont parties qu’aujourd’hui. Mon oncle était déçu de ne pas les avoir reçues. Arriveront-elles demain ?'],
  'noire.10': ['Mon jeu électronique est tombé en panne. Je l’ai débranché et l’ai remis dans sa boite. Ensuite je l’ai rapporté au magasin : ils m’ont dit qu’il était encore garanti. Ouf !', 'Ma console est tombée en panne. Je l’ai débranchée et l’ai remise dans sa boite. Ensuite je l’ai rapportée au magasin : ils m’ont dit qu’elle était encore garantie. Ouf !'],
  'noire.11': ['J’ai perdu mon sac. Je l’ai pris hier pour faire des courses. Je l’ai posé dans l’entrée en rentrant. Pourtant, il est noir et doré : je devrais le voir facilement. Est-ce toi qui me l’as emprunté ?', 'J’ai perdu ma clé. Je l’ai prise hier pour faire des courses. Je l’ai posée dans l’entrée en rentrant. Pourtant, elle est noire et dorée : je devrais la voir facilement. Est-ce toi qui me l’as empruntée ?'],
  'noire.12': ['J’ai perdu mes clés. Je les ai prises hier pour faire des courses. Je les ai posées dans l’entrée en rentrant. Pourtant, elles sont noires et dorées : je devrais les voir facilement. Est-ce toi qui me les as empruntées ?', 'J’ai perdu mon sac. Je l’ai pris hier pour faire des courses. Je l’ai posé dans l’entrée en rentrant. Pourtant, il est noir et doré : je devrais le voir facilement. Est-ce toi qui me l’as emprunté ?'],
};

describe('Accords', () => {
  const all = ACCORDS.flatMap((belt) => belt.texts.map((exercise) => ({ belt, exercise })));

  it('redonne les phrases des fiches et leurs corrections', () => {
    for (const [id, [start, answer]] of Object.entries(FICHES)) {
      const exercise = all.find((e) => e.exercise.id === id)?.exercise;
      expect(exercise, id).toBeDefined();
      expect(startSentence(exercise!), id).toBe(start);
      expect(sentenceOf(exercise!.text, 'answer'), id).toBe(answer);
    }
    // Chaque exercice des fiches est dans la table.
    expect(all.filter((e) => e.exercise.fiche !== undefined).map((e) => e.exercise.id).sort()).toEqual(Object.keys(FICHES).sort());
  });

  it('écrit chaque phrase proprement : des cases, une majuscule, un point (ou des mots seuls, en minuscules)', () => {
    for (const { exercise } of all) {
      const boxes = boxesOf(exercise.text);
      expect(boxes.length, exercise.id).toBeGreaterThan(0);
      expect(boxes.some((b) => !isTrap(b)), exercise.id).toBe(true);
      for (const box of boxes) {
        expect(box.start.trim(), exercise.id).toBe(box.start);
        expect(box.answer, exercise.id).not.toBe('');
      }
      for (const side of ['start', 'answer'] as const) {
        const sentence = sentenceOf(exercise.text, side);
        expect(sentence, exercise.id).not.toMatch(/[{}|[\]]|'|\s{2}|\s[.,]|[^\s][!?]/);
        if (sentence.includes(' / ')) expect(sentence, exercise.id).toMatch(/^\p{Ll}[^.!?]*\p{Ll}$/u);
        else expect(sentence, exercise.id).toMatch(/^[A-ZÀ-Ý].*[.!?…]$/su);
      }
      expect(exercise.instruction, exercise.id).toMatch(/^Transpose au (pluriel|singulier|féminin)\.$|^Remplace .+ par .+\.$|^Complète les terminaisons manquantes\.$/);
      // « Complète les terminaisons » : chaque case donne le début du mot à finir.
      if (exercise.instruction.startsWith('Complète')) for (const box of boxes) expect(box.answer.startsWith(prefillOf(box)) && prefillOf(box) !== '', exercise.id).toBe(true);
      // « Remplace Lina par Enzo. » : le prénom n'est pas dans une case, il est changé dans la phrase de départ.
      const swap = SWAP.exec(exercise.instruction);
      if (swap) expect(sentenceOf(exercise.text, 'answer'), exercise.id).toContain(swap[2]);
    }
  });

  it('va bien dans le sens de la consigne', () => {
    for (const { exercise } of all) {
      const changed = boxesOf(exercise.text).filter((b) => !isTrap(b));
      const plural = changed.filter((b) => /^(les|des|ils|elles|nous)$/i.test(b.answer.split(' ')[0]!) || /(s|x|nt)$/.test(b.answer));
      if (exercise.instruction === 'Transpose au pluriel.') expect(plural.length, exercise.id).toBeGreaterThan(0);
      if (exercise.instruction === 'Transpose au singulier.') expect(changed.some((b) => /^(les|des|mes|tes|ses|ces|ils|elles|nous)$/i.test(b.start.split(' ')[0]!)), exercise.id).toBe(true);
      if (exercise.instruction === 'Transpose au féminin.') expect(changed.every((b) => !/(s|x)$/.test(b.answer) || /(s|x)$/.test(b.start)), exercise.id).toBe(true);
    }
  });

  it('a des identifiants qui se suivent, des exercices des fiches et des nôtres', () => {
    for (const belt of ACCORDS) {
      expect(belt.texts.map((e) => e.id)).toEqual(belt.texts.map((_, i) => `${belt.belt}.${i + 1}`));
      expect(belt.texts.some((e) => e.fiche === undefined)).toBe(true);
      expect(belt.texts.length).toBeGreaterThanOrEqual(belt.testSize * 3);
    }
  });

  it('a des pièges (des mots qui ne changent pas) à partir de la jaune', () => {
    for (const belt of ACCORDS.slice(1)) {
      expect(belt.texts.filter((e) => boxesOf(e.text).some(isTrap)).length, belt.belt).toBeGreaterThanOrEqual(8);
    }
  });

  it('change sans case ce qui est entre crochets', () => {
    const text = '[Toufou|Toufou et Rex] {était|étaient} content. {Il|Ils} {joue|jouent}.';
    expect(sentenceOf(text, 'start')).toBe('Toufou était content. Il joue.');
    expect(sentenceOf(text, 'answer')).toBe('Toufou et Rex étaient content. Ils jouent.');
    expect(boxesOf(text).map((b) => b.capital)).toEqual([false, true, false]);
  });

  it('garde la majuscule des noms propres', () => {
    const [, grecs] = boxesOf('{Le|Les} {Grec|Grecs} {a|ont} navigué.');
    expect(shown(grecs!, 'grecs')).toBe('Grecs');
  });

  it('montre des textes, un à l’entraînement et deux en conditions réelles, au vert clair et au vert foncé', () => {
    for (const id of ['vert-clair', 'vert-fonce', 'bleu-fonce', 'violette', 'marron', 'noire'] as const) {
      expect(accordBelt(id), id).toMatchObject({ unit: 'texte', practiceSize: 1, testSize: 2 });
    }
    expect(accordBelt('bleu-clair')!.unit).toBeUndefined();
  });

  it('met la majuscule en début de phrase, pas aux mots seuls', () => {
    expect(boxesOf('{Son|Ses} {genou|genoux} gonfle. {Il|Ils} {est|sont} bleu.').map((b) => b.capital)).toEqual([true, false, true, false]);
    expect(boxesOf('{cet|cette} {acteur|actrice} / {un|une} {musicien|musicienne}').some((b) => b.capital)).toBe(false);
    expect(sentenceOf('{cet|cette} {acteur|actrice} / {réel|réelle}', 'answer')).toBe('cette actrice / réelle');
  });

  it('lit les cases : mot de départ, réponse, autres réponses justes, majuscule', () => {
    expect(parseAccord('{L’avion|Les avions} {décolle|décollent}.')).toEqual([
      { start: 'L’avion', answer: 'Les avions', also: [], capital: true },
      ' ',
      { start: 'décolle', answer: 'décollent', also: [], capital: false },
      '.',
    ]);
    expect(boxesOf('Il est {passé} {maitre|maitres/maîtres}.')[1]).toEqual({ start: 'maitre', answer: 'maitres', also: ['maîtres'], capital: false });
  });

  it('accepte la réponse en minuscules, avec l’apostrophe droite, et les autres orthographes', () => {
    const [box] = boxesOf('{Les enfants|L’enfant} {crient|crie}.');
    expect(isRight(box!, 'l’enfant')).toBe(true);
    expect(isRight(box!, "l'enfant")).toBe(true);
    expect(isRight(box!, ' L’enfant ')).toBe(true);
    expect(isRight(box!, 'l’enfants')).toBe(false);
    const maitre = boxesOf('Il est {passés|passé} {maitres|maitre/maître}.')[1]!;
    expect(isRight(maitre, 'maître')).toBe(true);
    expect(isRight(maitre, 'maitre')).toBe(true);
  });

  it('donne l’astuce qui va avec l’erreur', () => {
    const tip = (text: string) => tipFor(boxesOf(text)[0]!);
    expect(tip('{très}')).toMatch(/ne change pas/);
    expect(tip('{aboie|aboient}')).toMatch(/-nt/);
    expect(tip('{griffent|griffe}')).toMatch(/ne se termine pas par -nt/);
    expect(tip('{chien|chiens}')).toMatch(/prennent un -s/);
    expect(tip('{la|les}')).toMatch(/petit mot devant le nom/);
    expect(tip('{Les horloges|L’horloge}')).toMatch(/Au singulier/);
    expect(tip('{fatiguée|fatigué}')).toMatch(/masculin/);
    expect(tip('{Mon}')).toMatch(/voyelle/);
    expect(tip('{proies}')).toMatch(/ne va pas avec le sujet/);
    expect(tip('{bâti}')).toMatch(/avoir/);
    expect(tip('{souris}')).toMatch(/-s, -x ou -z/);
    expect(tip('{cheval|chevaux}')).toMatch(/-aux/);
    expect(tip('{travaux|travail}')).toMatch(/-ail/);
    expect(tip('{genou|genoux}')).toMatch(/-x/);
    expect(tip('{ce|ces}')).toMatch(/ces/);
    expect(tip('{ces|cette}')).toMatch(/Au singulier/);
    expect(tip('{cet|cette}')).toMatch(/Au féminin/);
    expect(tip('{a|ont}')).toMatch(/avoir/);
    expect(tip('{Nous effaçons|J’efface}')).toMatch(/Je devient nous/);
    expect(tip('{acteur|actrice}')).toMatch(/-trice/);
    expect(tip('{boucher|bouchère}')).toMatch(/-ère/);
    expect(tip('{gardien|gardienne}')).toMatch(/double/);
    expect(tip('{sportif|sportive}')).toMatch(/-ve/);
    expect(tip('{cheval|jument}')).toMatch(/changent complètement/);
    expect(tip('{ses|leurs}')).toMatch(/leurs/);
    expect(tip('{sa|leur}')).toMatch(/chacun en a un seul/);
    expect(tip('{leurs|ses}')).toMatch(/Au singulier/);
    expect(tip('{leur|son}')).toMatch(/son ou sa/);
    expect(tip('{rencontré}')).toMatch(/avoir/);
    expect(tip('{vraiment}')).toMatch(/-ment/);
    expect(tip('{C’est|Ce sont}')).toMatch(/ce sont/);
    expect(tip('{n’est|ne sont}')).toMatch(/être/);
    expect(tip('{Il|Elle}')).toMatch(/Au féminin/);
    expect(tip('{devenus|devenues}')).toMatch(/Au féminin/);
    expect(tip('{sautant}')).toMatch(/-ant/);
    expect(tip('{parl…|parle}')).toMatch(/sujet peut être après/);
    expect(tip('{lui|leur}')).toMatch(/sans -s/);
    expect(tip('{lui-même|eux-mêmes}')).toMatch(/eux-mêmes/);
    expect(tip('{Tout}')).toMatch(/tout va avec le nom/);
    expect(tip('{toute|toutes}')).toMatch(/Tout change/);
    expect(tip('{bleu foncé}')).toMatch(/deux mots/);
    expect(tip('{orange}')).toMatch(/orange et marron/);
    expect(tip('{Va-t-elle|Vont-elles}')).toMatch(/sujet est après le verbe/);
    expect(tip('{l’a|les a}')).toMatch(/devient les/);
    expect(tip('{qu’il|qu’elle}')).toMatch(/Au féminin/);
    expect(tip('{Elles|Ils}')).toMatch(/Au masculin/);
    expect(tip('{ramassées|ramassés}')).toMatch(/Au masculin/);
    expect(tip('{entretient|entretiennent}')).toMatch(/-nt/);
    expect(tip('{l’effort|la volonté}')).toMatch(/Quand le nom change/);
    expect(tip('{à la vache|aux vaches}')).toMatch(/Au pluriel/);
  });

  it('choisit l’astuce d’après les mots autour de la case', () => {
    const text = 'J’ai {perdu} {mes clés|mon sac}. Je {les ai|l’ai} {prises|pris}. Mon oncle était {déçu}. Ça {l’a} {fait} rigoler. Elle est {partie|parties}. {Même} si.';
    expect(tipAt(text, 0)).toMatch(/Avec avoir, le participe passé ne s’accorde pas/);
    expect(tipAt(text, 3)).toMatch(/placé avant le verbe/);
    expect(tipAt(text, 4)).toMatch(/un mot qui, lui, ne change pas/);
    expect(tipAt(text, 5)).toMatch(/l’ veut dire le ou la/);
    expect(tipAt(text, 6)).toMatch(/infinitif/);
    expect(tipAt(text, 7)).toMatch(/Après être/);
    expect(tipAt(text, 8)).toMatch(/même si/);
    // Sans les mots autour, l'astuce d'avant.
    expect(tipFor(boxesOf(text)[4]!)).toMatch(/avoir/);
  });

  it('donne le début du mot à finir, et rien pour une case ordinaire', () => {
    const [parle, enfant] = boxesOf('Les enfants dont {parl…|parle} {Les enfants|L’enfant}.');
    expect(prefillOf(parle!)).toBe('parl');
    expect(prefillOf(enfant!)).toBe('');
  });

  it('change tous les prénoms de la phrase de départ', () => {
    expect(startSentence({ id: 'x', instruction: 'Remplace Grandma par Grandpa.', text: 'Grandpa {est} là. Grandpa {dort}.' })).toBe('Grandma est là. Grandma dort.');
  });

  it('tire des phrases pas vues la dernière fois', () => {
    const belt = accordBelt('blanche')!;
    const seen = belt.texts.slice(0, 40).map((e) => e.id);
    for (let i = 0; i < 20; i++) {
      expect(pickAccords(belt, 3, seen).every((e) => !seen.includes(e.id))).toBe(true);
    }
  });
});

describe('série d’accords', () => {
  const blanche = accordBelt('blanche')!;
  const exercises = [blanche.texts[0]!, blanche.texts[20]!];

  it('compte case par case et garde les phrases ratées', () => {
    const session = new AccordSession(exercises);
    expect(session.total).toBe(4);
    expect(session.current()).toEqual({ exercise: exercises[0], index: 0 });
    expect(session.answer('les avions')).toBe(true);
    expect(session.answer('décolle')).toBe(false);
    expect(session.current()).toEqual({ exercise: exercises[1], index: 0 });
    session.answer('l’enfant');
    session.answer('arrive');
    expect(session.current()).toBeUndefined();
    expect(session.result()).toEqual({
      correct: 3,
      total: 4,
      passed: false,
      mistakes: [{ exercise: exercises[0], typed: ['les avions', 'décolle'] }],
      toPractice: ['Les avions décollent.'],
    });
  });

  it('revient au mot d’avant en conditions réelles', () => {
    const session = new AccordSession(exercises);
    session.answer('les avion');
    expect(session.undo()).toBe('les avion');
    expect(session.attempted).toBe(0);
    for (const word of ['les avions', 'décollent', 'l’enfant', 'arrive']) session.answer(word);
    expect(session.result()).toMatchObject({ correct: 4, total: 4, passed: true, mistakes: [] });
  });
});
