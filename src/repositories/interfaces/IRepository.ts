/**
 * Base Repository Interface Contract
 * Enables switching seamlessly between Firestore and Oracle Database.
 */

export interface IRepository<T> {
  findById(id: string): Promise<T | null>;
  findAll(): Promise<T[]>;
  create(item: T): Promise<T>;
  update(id: string, partial: Partial<T>): Promise<T>;
  delete(id: string): Promise<boolean>;
}
