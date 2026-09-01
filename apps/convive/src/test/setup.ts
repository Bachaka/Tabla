/**
 * src/test/setup.ts — préparation commune à tous les tests (chargé par Vitest).
 *
 * `@testing-library/jest-dom` ajoute des assertions lisibles sur le DOM, ex. :
 *   expect(bouton).toBeInTheDocument()
 *   expect(champ).toHaveAttribute("aria-pressed", "true")
 * au lieu de vérifications manuelles verbeuses.
 */
import "@testing-library/jest-dom/vitest";
